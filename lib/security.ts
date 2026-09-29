import { findProviderByHostname } from "./providers";
import { ProviderConfig } from "./types";

export interface ValidationResult {
  valid: boolean;
  errorCode?: "INVALID_URL" | "UNSUPPORTED";
  errorMessage?: string;
  provider?: ProviderConfig;
  parsedUrl?: URL;
}

/**
 * Memeriksa apakah sebuah string adalah IP address (IPv4, IPv6, localhost, atau private range)
 * untuk mencegah serangan SSRF (Server-Side Request Forgery).
 */
export function isPrivateOrIpAddress(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();

  // Cek localhost dan reserved local TLDs
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan")
  ) {
    return true;
  }

  // Cek IPv4 standar
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = host.match(ipv4Regex);
  if (ipv4Match) {
    const octets = [
      parseInt(ipv4Match[1], 10),
      parseInt(ipv4Match[2], 10),
      parseInt(ipv4Match[3], 10),
      parseInt(ipv4Match[4], 10),
    ];

    if (octets.some((o) => o > 255)) return true;

    // Loopback (127.0.0.0/8)
    if (octets[0] === 127) return true;
    // Private (10.0.0.0/8)
    if (octets[0] === 10) return true;
    // Private (172.16.0.0/12)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    // Private (192.168.0.0/16)
    if (octets[0] === 192 && octets[1] === 168) return true;
    // Link-local / Cloud metadata (169.254.0.0/16)
    if (octets[0] === 169 && octets[1] === 254) return true;
    // Broadcast / 0.0.0.0
    if (octets[0] === 0 || octets[0] === 255) return true;

    return true; // Semua direct IP ditolak
  }

  // Cek IPv6 standar
  if (host.includes(":") || host.startsWith("[") || host.endsWith("]")) {
    return true;
  }

  // Cek format IP numerik lain (misal integer/hex/octal)
  if (/^0x[0-9a-f]+$/i.test(host) || /^\d+$/.test(host)) {
    return true;
  }

  return false;
}

/**
 * Validasi ketat untuk URL input:
 * 1. Format URL harus valid
 * 2. Protokol wajib https://
 * 3. Menolak localhost, private IPs, dan direct IP (cegah SSRF)
 * 4. Hostname harus terdaftar di salah satu provider yang didukung
 */
export function validateBypassUrl(rawUrl: string): ValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return {
      valid: false,
      errorCode: "INVALID_URL",
      errorMessage: "URL tidak boleh kosong.",
    };
  }

  const trimmed = rawUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      errorCode: "INVALID_URL",
      errorMessage: "Format URL tidak valid. Pastikan penulisan URL sudah benar.",
    };
  }

  // Hanya izinkan https://
  if (parsed.protocol !== "https:") {
    return {
      valid: false,
      errorCode: "INVALID_URL",
      errorMessage: "Protokol tidak aman. Hanya URL dengan https:// yang diperbolehkan.",
    };
  }

  // Cegah SSRF terhadap localhost atau private network
  if (isPrivateOrIpAddress(parsed.hostname)) {
    return {
      valid: false,
      errorCode: "INVALID_URL",
      errorMessage: "Akses ke IP address atau domain internal tidak diperbolehkan.",
    };
  }

  // Periksa apakah provider terdaftar di whitelist lib/providers.ts
  const provider = findProviderByHostname(parsed.hostname);
  if (!provider) {
    return {
      valid: false,
      errorCode: "UNSUPPORTED",
      errorMessage: `Provider "${parsed.hostname}" belum didukung saat ini.`,
    };
  }

  return {
    valid: true,
    provider,
    parsedUrl: parsed,
  };
}

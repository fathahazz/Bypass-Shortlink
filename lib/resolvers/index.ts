import { resolveExternal } from "./external";
import { resolveNative } from "./native";
import { ErrorCode } from "../types";
import { isPrivateOrIpAddress } from "../security";

export interface OrchestrationResult {
  success: boolean;
  targetUrl?: string;
  source?: "external" | "native";
  errorCode?: ErrorCode;
  errorMessage?: string;
}

const TIMEOUT_MS = 15000; // 15 detik timeout per percobaan

/**
 * Menjalankan satu kali percobaan bypass (External -> Fallback Native) dengan timeout 15 detik.
 */
async function attemptBypass(
  url: string
): Promise<{ targetUrl: string; source: "external" | "native" }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // 1. Primary: Coba External API
    try {
      const result = await resolveExternal(url, controller.signal);
      if (result) {
        return { targetUrl: result, source: "external" };
      }
    } catch (err: unknown) {
      // Jika abort / timeout terjadi pada primary, langsung lempar
      if (controller.signal.aborted) {
        throw new Error("TIMEOUT");
      }
      // Jika bukan timeout, fallback ke native resolver
    }

    // 2. Fallback: Native Resolver
    const nativeResult = await resolveNative(url, controller.signal);
    return { targetUrl: nativeResult, source: "native" };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Eksekusi bypass dengan timeout 15 detik per percobaan dan maksimal 1 kali retry.
 * Menormalisasi seluruh kegagalan menjadi ErrorCode standar.
 */
export async function executeBypassWithRetry(
  url: string
): Promise<OrchestrationResult> {
  const maxAttempts = 2; // 1 kali percobaan awal + 1 kali retry
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await attemptBypass(url);

      // Validasi URL hasil resolusi (cegah SSRF dan URL tak valid pada hasil akhir)
      let parsedTarget: URL;
      try {
        parsedTarget = new URL(res.targetUrl);
      } catch {
        return {
          success: false,
          errorCode: "UPSTREAM_FAILED",
          errorMessage: "Penyedia upstream mengembalikan URL tujuan yang tidak valid.",
        };
      }

      if (
        (parsedTarget.protocol !== "https:" && parsedTarget.protocol !== "http:") ||
        isPrivateOrIpAddress(parsedTarget.hostname)
      ) {
        return {
          success: false,
          errorCode: "UPSTREAM_FAILED",
          errorMessage: "URL tujuan mengarah ke alamat internal atau protokol tidak aman.",
        };
      }

      return {
        success: true,
        targetUrl: res.targetUrl,
        source: res.source,
      };
    } catch (err: unknown) {
      lastError = err;
      // Jika ini percobaan pertama dan bukan intentional abort karena user, jeda sedikit lalu coba lagi
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  // Normalisasi error
  const errString = String(lastError);
  if (
    errString.includes("TIMEOUT") ||
    errString.includes("aborted") ||
    errString.includes("AbortError")
  ) {
    return {
      success: false,
      errorCode: "TIMEOUT",
      errorMessage: "Permintaan memakan waktu terlalu lama (timeout 15 detik). Silakan coba lagi.",
    };
  }

  return {
    success: false,
    errorCode: "UPSTREAM_FAILED",
    errorMessage:
      "Gagal memproses link dari penyedia upstream. Link mungkin kedaluwarsa atau memerlukan verifikasi tambahan.",
  };
}

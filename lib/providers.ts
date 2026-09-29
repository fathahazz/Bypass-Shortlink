import { ProviderConfig } from "./types";

/**
 * Daftar konfigurasi provider yang didukung.
 * Untuk menambah provider baru, cukup tambahkan objek baru ke array ini.
 */
export const SUPPORTED_PROVIDERS: ProviderConfig[] = [
  {
    id: "sfl",
    name: "SFL.gl / Linku",
    domains: ["sfl.gl", "linku.to"],
    example: "https://sfl.gl/sample-link",
    description: "Shortlink SFL & Linku.to",
  },
  {
    id: "linkvertise",
    name: "Linkvertise Network",
    domains: ["linkvertise.com", "link-hub.net", "direct-link.net"],
    example: "https://linkvertise.com/12345/sample",
    description: "Jaringan linkvertise, link-hub, direct-link",
  },
  {
    id: "lootlabs",
    name: "LootLabs",
    domains: ["loot-link.com", "lootlink.org", "lootdest.org"],
    example: "https://loot-link.com/s?sample",
    description: "Jaringan loot-link & lootdest",
  },
  {
    id: "workink",
    name: "Work.ink",
    domains: ["work.ink"],
    example: "https://work.ink/sample",
    description: "Layanan shortlink work.ink",
  },
  {
    id: "yourls",
    name: "YOURLS Instance",
    domains: ["yourls.org"],
    pattern: /^yourl\.[a-z]{2,}$/i,
    example: "https://yourl.to/sample",
    description: "Domain berbasis shortener YOURLS (yourl.*)",
  },
];

/**
 * Mencari konfigurasi provider berdasarkan hostname dari URL.
 * Memeriksa domain statis terlebih dahulu, kemudian regex pattern jika ada.
 */
export function findProviderByHostname(hostname: string): ProviderConfig | null {
  const normalized = hostname.toLowerCase();

  for (const provider of SUPPORTED_PROVIDERS) {
    // 1. Cocokkan dengan domain pasti atau subdomain
    const domainMatch = provider.domains.some(
      (d) => normalized === d || normalized.endsWith(`.${d}`)
    );
    if (domainMatch) return provider;

    // 2. Cocokkan dengan pattern jika didefinisikan (misal yourl.*)
    if (provider.pattern && provider.pattern.test(normalized)) {
      return provider;
    }
  }

  return null;
}

/**
 * Mendapatkan seluruh daftar provider yang aktif.
 */
export function getAllProviders(): ProviderConfig[] {
  return SUPPORTED_PROVIDERS;
}

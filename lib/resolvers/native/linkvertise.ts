import { ResolverAdapter } from "../types";
import { extractEmbeddedUrl, followSafeRedirect } from "./utils";
import { isPrivateOrIpAddress } from "@/lib/security";

const LINKVERTISE_HOSTS = ["linkvertise.com", "link-hub.net", "direct-link.net"];

export const linkvertiseResolver: ResolverAdapter = {
  id: "linkvertise",
  canHandle(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return LINKVERTISE_HOSTS.some(
        (h) => hostname === h || hostname.endsWith(`.${h}`)
      );
    } catch {
      return false;
    }
  },
  async resolve(url: string, signal?: AbortSignal): Promise<string> {
    // 1. Cek parameter r / target jika linkvertise menyertakan r query param
    const embedded = extractEmbeddedUrl(url);
    if (embedded) return embedded;

    // 2. Coba metode native Linkvertise Publisher API
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/(\d+)\/([^\/\?#]+)/);

      if (match) {
        const userId = match[1];
        const linkName = match[2];
        const linkPath = `${userId}/${linkName}`;

        const headers = {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        // A. Ambil link_id dari endpoint static
        const staticRes = await fetch(
          `https://publisher.linkvertise.com/api/v1/redirect/link/static/${linkPath}`,
          { headers, signal }
        );

        if (staticRes.ok) {
          const staticData = await staticRes.json().catch(() => null);
          const linkId = staticData?.data?.link?.id;

          if (linkId) {
            // B. Buat serial payload terenkripsi base64
            const serialPayload = {
              timestamp: Date.now(),
              random: "6548307",
              link_id: linkId,
            };
            const serial = Buffer.from(JSON.stringify(serialPayload)).toString("base64");

            // C. Request target URL
            const targetRes = await fetch(
              `https://publisher.linkvertise.com/api/v1/redirect/link/${linkPath}/target?serial=${encodeURIComponent(
                serial
              )}`,
              { headers, signal }
            );

            if (targetRes.ok) {
              const targetData = await targetRes.json().catch(() => null);
              const destination = targetData?.data?.target;

              if (destination && typeof destination === "string") {
                const targetParsed = new URL(destination);
                if (!isPrivateOrIpAddress(targetParsed.hostname)) {
                  return destination;
                }
              }
            }
          }
        }
      }
    } catch {}

    // 3. Best-effort redirect inspection
    const destination = await followSafeRedirect(url, signal);
    if (destination && destination !== url) {
      return destination;
    }

    throw new Error("LINKVERTISE_NATIVE_BYPASS_FAILED");
  },
};

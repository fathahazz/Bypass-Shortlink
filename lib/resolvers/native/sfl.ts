import { ResolverAdapter } from "../types";
import { extractEmbeddedUrl, followSafeRedirect } from "./utils";
import { isPrivateOrIpAddress } from "@/lib/security";

export const sflResolver: ResolverAdapter = {
  id: "sfl",
  canHandle(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return (
        hostname === "sfl.gl" ||
        hostname.endsWith(".sfl.gl") ||
        hostname === "linku.to" ||
        hostname.endsWith(".linku.to")
      );
    } catch {
      return false;
    }
  },
  async resolve(url: string, signal?: AbortSignal): Promise<string> {
    // 1. Cek parameter URL tertanam langsung
    const embedded = extractEmbeddedUrl(url);
    if (embedded) return embedded;

    // 2. Ikuti redirect HTTP awal (sfl.gl sekarang redirect ke linku.to)
    const initialRedirect = await followSafeRedirect(url, signal);
    const target = initialRedirect || url;

    // Jika sudah mengarah ke luar sfl/linku, berarti langsung tembus
    try {
      const parsed = new URL(target);
      if (
        !parsed.hostname.includes("sfl.gl") &&
        !parsed.hostname.includes("linku.to") &&
        !isPrivateOrIpAddress(parsed.hostname)
      ) {
        return target;
      }
    } catch {}

    // 3. Coba parsing halaman (ekstraksi token AdLinkFly / Safelink / Next.js)
    try {
      const response = await fetch(target, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "id,en-US;q=0.9,en;q=0.8",
        },
        signal,
      });

      if (response.ok) {
        const html = await response.text();
        const cookies = response.headers.get("set-cookie") || "";

        // A. Cek __NEXT_DATA__ jika linku.to berbasis Next.js
        const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
        if (nextDataMatch && nextDataMatch[1]) {
          try {
            const nextJson = JSON.parse(nextDataMatch[1]);
            const pageProps = nextJson?.props?.pageProps;
            const possibleUrl =
              pageProps?.url ||
              pageProps?.destination ||
              pageProps?.target ||
              pageProps?.link?.url;
            if (possibleUrl && typeof possibleUrl === "string") {
              const parsed = new URL(possibleUrl);
              if (!isPrivateOrIpAddress(parsed.hostname)) {
                return possibleUrl;
              }
            }
          } catch {}
        }

        // B. Cek Form AdLinkFly (form id="go-link" atau action="/links/go")
        const formMatch = html.match(/<form[^>]*action=["']([^"']*?links\/go[^"']*?)["'][^>]*>([\s\S]*?)<\/form>/i);
        if (formMatch) {
          const actionUrl = new URL(formMatch[1], target).toString();
          const formBody = formMatch[2];

          // Ekstrak input hidden
          const params = new URLSearchParams();
          const inputRegex = /<input[^>]*type=["']hidden["'][^>]*name=["']([^"']+)["'][^>]*value=["']([^"']*)["'][^>]*>/gi;
          let match: RegExpExecArray | null;
          while ((match = inputRegex.exec(formBody)) !== null) {
            params.append(match[1], match[2]);
          }

          if (params.toString()) {
            const goRes = await fetch(actionUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                Referer: target,
                Cookie: cookies,
              },
              body: params.toString(),
              signal,
            });

            if (goRes.ok) {
              const goData = await goRes.json().catch(() => null);
              if (goData && goData.url && typeof goData.url === "string") {
                const parsed = new URL(goData.url);
                if (!isPrivateOrIpAddress(parsed.hostname)) {
                  return goData.url;
                }
              }
            }
          }
        }
      }
    } catch {}

    throw new Error("SFL_RESOLVE_FAILED");
  },
};

import { isPrivateOrIpAddress } from "@/lib/security";

/**
 * Utilitas untuk mencoba mengekstrak URL tujuan via redirect HTTP 301/302,
 * meta refresh, atau tag script redirect secara aman (best-effort).
 */
export async function followSafeRedirect(
  targetUrl: string,
  signal?: AbortSignal
): Promise<string | null> {
  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      redirect: "manual", // Jangan otomatis lompat agar bisa menangkap Location
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      signal,
    });

    // 1. Cek header redirect (301, 302, 307, 308)
    const location = response.headers.get("location");
    if (location) {
      const resolved = new URL(location, targetUrl).toString();
      const resolvedParsed = new URL(resolved);

      // Pastikan target redirect bukan private network (cegah SSRF via redirect)
      if (
        (resolvedParsed.protocol === "https:" || resolvedParsed.protocol === "http:") &&
        !isPrivateOrIpAddress(resolvedParsed.hostname)
      ) {
        return resolved;
      }
    }

    // 2. Jika 200 OK, periksa meta refresh atau payload JSON sederhana
    if (response.status === 200) {
      const text = await response.text();

      // Cek <meta http-equiv="refresh" content="...;url=...">
      const metaMatch = text.match(/<meta[^>]*?http-equiv=["']refresh["'][^>]*?content=["'][^"']*?url=([^"'>\s]+)/i);
      if (metaMatch && metaMatch[1]) {
        const cleanUrl = metaMatch[1].replace(/['"]/g, "").trim();
        const metaResolved = new URL(cleanUrl, targetUrl).toString();
        const parsed = new URL(metaResolved);
        if (!isPrivateOrIpAddress(parsed.hostname)) {
          return metaResolved;
        }
      }

      // Cek window.location = "..."
      const jsMatch = text.match(/window\.location(?:\.href)?\s*=\s*["']([^"']+)["']/i);
      if (jsMatch && jsMatch[1]) {
        const jsUrl = jsMatch[1].trim();
        if (jsUrl.startsWith("http://") || jsUrl.startsWith("https://")) {
          const parsed = new URL(jsUrl);
          if (!isPrivateOrIpAddress(parsed.hostname)) {
            return jsUrl;
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Memeriksa apakah URL memiliki parameter tujuan terselubung (misal ?dest=, ?url=, ?r= dsb).
 */
export function extractEmbeddedUrl(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr);
    const searchParams = parsed.searchParams;

    const candidateKeys = ["url", "dest", "target", "destination", "link", "r", "to", "redirect"];
    for (const key of candidateKeys) {
      const val = searchParams.get(key);
      if (!val) continue;

      // Cek apakah langsung URL http/https
      if (val.startsWith("https://") || val.startsWith("http://")) {
        const testUrl = new URL(val);
        if (!isPrivateOrIpAddress(testUrl.hostname)) {
          return val;
        }
      }

      // Cek apakah base64 encoded
      try {
        const decoded = Buffer.from(val, "base64").toString("utf-8");
        if (decoded.startsWith("https://") || decoded.startsWith("http://")) {
          const testUrl = new URL(decoded);
          if (!isPrivateOrIpAddress(testUrl.hostname)) {
            return decoded;
          }
        }
      } catch {
        // Abaikan jika bukan base64 valid
      }
    }

    return null;
  } catch {
    return null;
  }
}

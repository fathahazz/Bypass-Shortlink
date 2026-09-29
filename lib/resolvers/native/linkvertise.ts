import { ResolverAdapter } from "../types";
import { extractEmbeddedUrl, followSafeRedirect } from "./utils";

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

    // 2. Best-effort redirect inspection
    const destination = await followSafeRedirect(url, signal);
    if (destination && destination !== url) {
      return destination;
    }

    throw new Error("LINKVERTISE_NATIVE_BYPASS_REQUIRES_EXTERNAL_API");
  },
};

import { ResolverAdapter } from "../types";
import { extractEmbeddedUrl, followSafeRedirect } from "./utils";

export const sflResolver: ResolverAdapter = {
  id: "sfl",
  canHandle(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname === "sfl.gl" || hostname.endsWith(".sfl.gl");
    } catch {
      return false;
    }
  },
  async resolve(url: string, signal?: AbortSignal): Promise<string> {
    // 1. Cek parameter URL tertanam
    const embedded = extractEmbeddedUrl(url);
    if (embedded) return embedded;

    // 2. Coba ikuti HTTP redirect / meta refresh secara aman
    const destination = await followSafeRedirect(url, signal);
    if (destination && destination !== url) {
      return destination;
    }

    throw new Error("SFL_RESOLVE_FAILED");
  },
};

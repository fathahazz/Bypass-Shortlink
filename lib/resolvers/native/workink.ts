import { ResolverAdapter } from "../types";
import { extractEmbeddedUrl, followSafeRedirect } from "./utils";

export const workinkResolver: ResolverAdapter = {
  id: "workink",
  canHandle(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname === "work.ink" || hostname.endsWith(".work.ink");
    } catch {
      return false;
    }
  },
  async resolve(url: string, signal?: AbortSignal): Promise<string> {
    const embedded = extractEmbeddedUrl(url);
    if (embedded) return embedded;

    const destination = await followSafeRedirect(url, signal);
    if (destination && destination !== url) {
      return destination;
    }

    throw new Error("WORKINK_RESOLVE_FAILED");
  },
};

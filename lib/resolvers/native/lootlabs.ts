import { ResolverAdapter } from "../types";
import { extractEmbeddedUrl, followSafeRedirect } from "./utils";

const LOOTLABS_HOSTS = ["loot-link.com", "lootlink.org", "lootdest.org"];

export const lootlabsResolver: ResolverAdapter = {
  id: "lootlabs",
  canHandle(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return LOOTLABS_HOSTS.some(
        (h) => hostname === h || hostname.endsWith(`.${h}`)
      );
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

    throw new Error("LOOTLABS_RESOLVE_FAILED");
  },
};

import { ResolverAdapter } from "../types";
import { followSafeRedirect } from "./utils";

export const yourlsResolver: ResolverAdapter = {
  id: "yourls",
  canHandle(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return (
        hostname.startsWith("yourl.") ||
        hostname === "yourls.org" ||
        hostname.endsWith(".yourls.org")
      );
    } catch {
      return false;
    }
  },
  async resolve(url: string, signal?: AbortSignal): Promise<string> {
    const destination = await followSafeRedirect(url, signal);
    if (destination && destination !== url) {
      return destination;
    }

    throw new Error("YOURLS_RESOLVE_FAILED");
  },
};

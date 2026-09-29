import { ResolverAdapter } from "../types";
import { linkvertiseResolver } from "./linkvertise";
import { lootlabsResolver } from "./lootlabs";
import { sflResolver } from "./sfl";
import { workinkResolver } from "./workink";
import { yourlsResolver } from "./yourls";
import { followSafeRedirect } from "./utils";

export const nativeResolvers: ResolverAdapter[] = [
  sflResolver,
  linkvertiseResolver,
  lootlabsResolver,
  workinkResolver,
  yourlsResolver,
];

/**
 * Mencari resolver native yang cocok berdasarkan URL.
 */
export function findNativeResolver(url: string): ResolverAdapter | null {
  for (const resolver of nativeResolvers) {
    if (resolver.canHandle(url)) {
      return resolver;
    }
  }
  return null;
}

/**
 * Eksekusi native resolver fallback.
 */
export async function resolveNative(
  url: string,
  signal?: AbortSignal
): Promise<string> {
  const resolver = findNativeResolver(url);
  if (resolver) {
    return await resolver.resolve(url, signal);
  }

  // Best effort fallback umum jika tidak ada resolver spesifik yang cocok
  const redirectTarget = await followSafeRedirect(url, signal);
  if (redirectTarget && redirectTarget !== url) {
    return redirectTarget;
  }

  throw new Error("NATIVE_RESOLVE_FAILED");
}

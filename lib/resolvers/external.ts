/**
 * Adapter untuk API Bypass Eksternal (Primary Resolver).
 * Dibungkus di sini agar jika penyedia API eksternal berganti,
 * Anda hanya perlu menyesuaikan request payload dan mapping response di file ini.
 */
export async function resolveExternal(
  targetUrl: string,
  signal?: AbortSignal
): Promise<string> {
  const apiUrl = process.env.BYPASS_API_URL;
  const apiKey = process.env.BYPASS_API_KEY;

  if (!apiUrl) {
    throw new Error("EXTERNAL_API_NOT_CONFIGURED");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["x-api-key"] = apiKey;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ url: targetUrl }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `EXTERNAL_API_ERROR: HTTP ${response.status} ${response.statusText} ${errorText}`
    );
  }

  const data = await response.json().catch(() => null);
  if (!data) {
    throw new Error("EXTERNAL_API_EMPTY_RESPONSE");
  }

  // Mendukung berbagai format response umum dari penyedia resolver API
  const destination =
    data.targetUrl ||
    data.destination ||
    data.result ||
    data.target ||
    data.url;

  if (!destination || typeof destination !== "string") {
    throw new Error("EXTERNAL_API_INVALID_PAYLOAD");
  }

  return destination.trim();
}

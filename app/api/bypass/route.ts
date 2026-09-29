import { NextRequest, NextResponse } from "next/server";
import { validateBypassUrl } from "@/lib/security";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { executeBypassWithRetry } from "@/lib/resolvers";
import { recordProviderResult } from "@/lib/metrics";
import { BypassResponse, ErrorCode } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. Rate Limiting Check (10 request/menit per IP)
  const rl = await checkRateLimit(ip);
  const rateLimitHeaders: Record<string, string> = {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(rl.reset),
  };

  if (!rl.success) {
    const errorResponse: BypassResponse = {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: `Terlalu banyak permintaan. Silakan tunggu ${rl.retryAfter} detik lagi.`,
      },
    };

    return NextResponse.json(errorResponse, {
      status: 429,
      headers: {
        ...rateLimitHeaders,
        "Retry-After": String(rl.retryAfter),
      },
    });
  }

  // 2. Parse Request Body
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    const errorResponse: BypassResponse = {
      success: false,
      error: {
        code: "INVALID_URL",
        message: "Format payload request JSON tidak valid.",
      },
    };
    return NextResponse.json(errorResponse, {
      status: 400,
      headers: rateLimitHeaders,
    });
  }

  const rawUrl = typeof body?.url === "string" ? body.url : "";

  // 3. Validasi Keamanan & Hostname Whitelist (SSRF Prevention)
  const validation = validateBypassUrl(rawUrl);
  if (!validation.valid || !validation.provider || !validation.parsedUrl) {
    const errorResponse: BypassResponse = {
      success: false,
      error: {
        code: validation.errorCode || "INVALID_URL",
        message: validation.errorMessage || "URL tidak valid.",
      },
    };

    const status = validation.errorCode === "UNSUPPORTED" ? 422 : 400;
    return NextResponse.json(errorResponse, {
      status,
      headers: rateLimitHeaders,
    });
  }

  const provider = validation.provider;

  // 4. Eksekusi Resolver (Primary External -> Fallback Native, 15s timeout, max 1 retry)
  const result = await executeBypassWithRetry(validation.parsedUrl.toString());

  // 5. Catat Metrik Kesehatan Provider (hanya status boolean, tanpa menyimpan URL)
  await recordProviderResult(provider.id, result.success);

  if (!result.success || !result.targetUrl) {
    const code: ErrorCode = result.errorCode || "UPSTREAM_FAILED";
    const httpStatus = code === "TIMEOUT" ? 504 : 502;

    const errorResponse: BypassResponse = {
      success: false,
      error: {
        code,
        message: result.errorMessage || "Gagal memproses URL.",
      },
    };

    return NextResponse.json(errorResponse, {
      status: httpStatus,
      headers: rateLimitHeaders,
    });
  }

  // 6. Response Sukses
  const successResponse: BypassResponse = {
    success: true,
    targetUrl: result.targetUrl,
    originalUrl: validation.parsedUrl.toString(),
    provider: provider.name,
    source: result.source || "native",
  };

  return NextResponse.json(successResponse, {
    status: 200,
    headers: rateLimitHeaders,
  });
}

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfter: number; // Seconds to wait
}

// In-Memory store fallback jika Upstash Redis tidak dikonfigurasi
interface MemoryRecord {
  count: number;
  resetTime: number; // in milliseconds
}

const memoryStore = new Map<string, MemoryRecord>();

// Bersihkan memory store setiap 5 menit
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      if (now > value.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

const WINDOW_SECONDS = 60;
const LIMIT_PER_WINDOW = 10;

/**
 * Inisialisasi Upstash Ratelimit jika env tersedia.
 */
let upstashRatelimit: Ratelimit | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(LIMIT_PER_WINDOW, `${WINDOW_SECONDS} s`),
      analytics: false,
      prefix: "rl:bypass",
    });
  } catch (err) {
    console.warn("Gagal inisialisasi Upstash Redis, beralih ke in-memory:", err);
    upstashRatelimit = null;
  }
}

/**
 * Memeriksa rate limit untuk identifier (IP address) tertentu.
 * Batas: 10 request / 60 detik.
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  // Jika Upstash Redis aktif
  if (upstashRatelimit) {
    try {
      const result = await upstashRatelimit.limit(identifier);
      const now = Math.floor(Date.now() / 1000);
      const resetSec = Math.floor(result.reset / 1000);
      const retryAfter = result.success ? 0 : Math.max(1, resetSec - now);

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: resetSec,
        retryAfter,
      };
    } catch (e) {
      console.warn("Gagal query Upstash ratelimit, fallback in-memory:", e);
      // fallback jika redis error
    }
  }

  // Fallback In-Memory Rate Limiting
  const now = Date.now();
  const record = memoryStore.get(identifier);

  if (!record || now >= record.resetTime) {
    const resetTime = now + WINDOW_SECONDS * 1000;
    memoryStore.set(identifier, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      limit: LIMIT_PER_WINDOW,
      remaining: LIMIT_PER_WINDOW - 1,
      reset: Math.floor(resetTime / 1000),
      retryAfter: 0,
    };
  }

  if (record.count >= LIMIT_PER_WINDOW) {
    const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
      success: false,
      limit: LIMIT_PER_WINDOW,
      remaining: 0,
      reset: Math.floor(record.resetTime / 1000),
      retryAfter,
    };
  }

  record.count += 1;
  const retryAfter = 0;

  return {
    success: true,
    limit: LIMIT_PER_WINDOW,
    remaining: LIMIT_PER_WINDOW - record.count,
    reset: Math.floor(record.resetTime / 1000),
    retryAfter,
  };
}

/**
 * Ekstrak IP address aman dari request headers (Next.js / Vercel).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

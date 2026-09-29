import { Redis } from "@upstash/redis";
import { ProviderStatus } from "./types";

const MAX_SAMPLES = 20;

// In-Memory store fallback
const memoryMetrics = new Map<string, boolean[]>();

let redisClient: Redis | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch {
    redisClient = null;
  }
}

/**
 * Mencatat hasil resolusi provider (hanya status sukses/gagal, TANPA mencatat URL pengguna).
 */
export async function recordProviderResult(
  providerId: string,
  success: boolean
): Promise<void> {
  const value = success ? "1" : "0";

  if (redisClient) {
    try {
      const key = `metrics:provider:${providerId}`;
      await redisClient.lpush(key, value);
      await redisClient.ltrim(key, 0, MAX_SAMPLES - 1);
      return;
    } catch {
      // Fallback ke memori jika redis query gagal
    }
  }

  // Fallback in-memory
  const list = memoryMetrics.get(providerId) || [];
  list.unshift(success);
  if (list.length > MAX_SAMPLES) {
    list.length = MAX_SAMPLES;
  }
  memoryMetrics.set(providerId, list);
}

/**
 * Menghitung status operasional berdasarkan 20 request terakhir:
 * - Belum ada data: "unknown"
 * - Success rate >= 85%: "operational"
 * - Success rate 50% - 84%: "degraded"
 * - Success rate < 50%: "down"
 */
export async function getProviderHealth(
  providerId: string
): Promise<{ status: ProviderStatus; successRate: number | null; totalSamples: number }> {
  let samples: boolean[] = [];

  if (redisClient) {
    try {
      const key = `metrics:provider:${providerId}`;
      const raw = await redisClient.lrange<string>(key, 0, MAX_SAMPLES - 1);
      if (raw && Array.isArray(raw)) {
        samples = raw.map((val) => val === "1");
      }
    } catch {
      samples = memoryMetrics.get(providerId) || [];
    }
  } else {
    samples = memoryMetrics.get(providerId) || [];
  }

  const total = samples.length;
  if (total === 0) {
    return {
      status: "unknown",
      successRate: null,
      totalSamples: 0,
    };
  }

  const successes = samples.filter(Boolean).length;
  const rate = Math.round((successes / total) * 100);

  let status: ProviderStatus = "operational";
  if (rate < 50) {
    status = "down";
  } else if (rate < 85) {
    status = "degraded";
  }

  return {
    status,
    successRate: rate,
    totalSamples: total,
  };
}

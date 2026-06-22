import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { apiMessage } from "@/lib/i18n/api-messages";

// Fixed-window rate limiter with two backends:
//
//   • Upstash Redis — shared across instances, used when
//     UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set. This is what
//     makes limits real on Vercel/Lambda, where each invocation may be a fresh
//     instance with its own memory.
//   • In-memory Map — fallback for local dev / tests (and any single-instance
//     deploy) so nothing needs Redis to run. NOT shared across instances and
//     resets on restart, so don't rely on it in multi-instance prod.
//
// Both expose the same async `checkRateLimit(key, limit, windowMs)` so callers
// (and `rateLimitResponse`) are backend-agnostic.

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets (for Retry-After). */
  retryAfter: number;
}

// ── Upstash backend ──────────────────────────────────────────────

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis =
  upstashUrl && upstashToken
    ? new Redis({ url: upstashUrl, token: upstashToken })
    : null;

// One Ratelimit instance per (limit, windowMs) config, reused across requests.
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
      prefix: "cvisual:rl",
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

async function checkUpstash(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const { success, reset } = await getLimiter(limit, windowMs).limit(key);
  return {
    allowed: success,
    retryAfter: success
      ? 0
      : Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
  };
}

// ── In-memory backend ────────────────────────────────────────────

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

// Drop expired buckets opportunistically so the Map can't grow unbounded.
function sweep(now: number) {
  if (buckets.size < 10_000) return;
  for (const [key, w] of buckets) {
    if (w.resetAt <= now) buckets.delete(key);
  }
}

function checkMemory(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count++;
  return { allowed: true, retryAfter: 0 };
}

// ── Public API ───────────────────────────────────────────────────

/** True when the shared Redis backend is active (vs the in-memory fallback). */
export const isDistributedRateLimit = redis !== null;

/**
 * Allow up to `limit` hits per `windowMs` for a given key. Uses Upstash Redis
 * when configured, else the in-memory fallback. Returns { allowed, retryAfter }
 * — caller sends 429 when !allowed. On a Redis error it fails **open** (allows)
 * so an outage can't lock everyone out.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!redis) return checkMemory(key, limit, windowMs);
  try {
    return await checkUpstash(key, limit, windowMs);
  } catch (err) {
    console.error("[rate-limit] Upstash error, allowing request:", err);
    return { allowed: true, retryAfter: 0 };
  }
}

/**
 * Throttle a key and return a ready-to-send 429 response when over the limit,
 * or `null` when the request may proceed. Centralizes the JSON body + the
 * `Retry-After` header so routes don't duplicate the 429 boilerplate:
 *
 *   const limited = await rateLimitResponse(`save:${userId}`, 30, 60_000);
 *   if (limited) return limited;
 */
export async function rateLimitResponse(
  key: string,
  limit: number,
  windowMs: number,
  request?: { headers: Headers },
): Promise<NextResponse | null> {
  const rl = await checkRateLimit(key, limit, windowMs);
  if (rl.allowed) return null;
  return NextResponse.json(
    {
      error: request
        ? apiMessage(request, "rateLimited")
        : "Trop de tentatives. Réessayez plus tard.",
    },
    { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
  );
}

/**
 * Best-effort client IP from proxy headers. Falls back to "unknown" (which
 * buckets all header-less callers together — acceptable for auth throttling).
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

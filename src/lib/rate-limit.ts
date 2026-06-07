// In-memory fixed-window rate limiter.
//
// Scope: single-instance only. State lives in this process's memory, so it is
// NOT shared across multiple server instances / serverless lambdas and resets
// on restart. Good enough to blunt brute-force / credential-stuffing on auth
// routes for a single Node deployment. For multi-instance prod, swap the Map
// for Redis (e.g. @upstash/ratelimit) keeping the same checkRateLimit signature.

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

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets (for Retry-After). */
  retryAfter: number;
}

/**
 * Allow up to `limit` hits per `windowMs` for a given key.
 * Returns { allowed, retryAfter } — caller sends 429 when !allowed.
 */
export function checkRateLimit(
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

/**
 * Best-effort client IP from proxy headers. Falls back to "unknown" (which
 * buckets all header-less callers together — acceptable for auth throttling).
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

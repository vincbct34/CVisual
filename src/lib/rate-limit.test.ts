import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, getClientIp, rateLimitResponse } from "./rate-limit";

// No Upstash env in tests → these exercise the in-memory fallback backend.

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the limit then blocks", async () => {
    const key = `t-${Math.random()}`;
    expect((await checkRateLimit(key, 3, 1000)).allowed).toBe(true);
    expect((await checkRateLimit(key, 3, 1000)).allowed).toBe(true);
    expect((await checkRateLimit(key, 3, 1000)).allowed).toBe(true);
    const blocked = await checkRateLimit(key, 3, 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("tracks each key independently", async () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect((await checkRateLimit(a, 1, 1000)).allowed).toBe(true);
    expect((await checkRateLimit(a, 1, 1000)).allowed).toBe(false);
    expect((await checkRateLimit(b, 1, 1000)).allowed).toBe(true);
  });

  it("resets after the window elapses", async () => {
    const key = `w-${Math.random()}`;
    expect((await checkRateLimit(key, 1, 1000)).allowed).toBe(true);
    expect((await checkRateLimit(key, 1, 1000)).allowed).toBe(false);
    vi.advanceTimersByTime(1001);
    expect((await checkRateLimit(key, 1, 1000)).allowed).toBe(true);
  });
});

describe("rateLimitResponse", () => {
  it("returns null while under the limit", async () => {
    const key = `r-${Math.random()}`;
    expect(await rateLimitResponse(key, 1, 1000)).toBeNull();
  });

  it("returns a 429 with Retry-After once over the limit", async () => {
    const key = `r-${Math.random()}`;
    expect(await rateLimitResponse(key, 1, 1000)).toBeNull();
    const res = await rateLimitResponse(key, 1, 1000);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(Number(res!.headers.get("Retry-After"))).toBeGreaterThan(0);
    await expect(res!.json()).resolves.toMatchObject({
      error: expect.any(String),
    });
  });
});

describe("getClientIp", () => {
  it("takes the first IP from x-forwarded-for", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip then unknown", () => {
    expect(
      getClientIp(
        new Request("http://x", { headers: { "x-real-ip": "9.9.9.9" } }),
      ),
    ).toBe("9.9.9.9");
    expect(getClientIp(new Request("http://x"))).toBe("unknown");
  });
});

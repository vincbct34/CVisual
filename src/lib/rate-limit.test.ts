import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, getClientIp } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the limit then blocks", () => {
    const key = `t-${Math.random()}`;
    expect(checkRateLimit(key, 3, 1000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 1000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 1000).allowed).toBe(true);
    const blocked = checkRateLimit(key, 3, 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("tracks each key independently", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(checkRateLimit(a, 1, 1000).allowed).toBe(true);
    expect(checkRateLimit(a, 1, 1000).allowed).toBe(false);
    expect(checkRateLimit(b, 1, 1000).allowed).toBe(true);
  });

  it("resets after the window elapses", () => {
    const key = `w-${Math.random()}`;
    expect(checkRateLimit(key, 1, 1000).allowed).toBe(true);
    expect(checkRateLimit(key, 1, 1000).allowed).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(checkRateLimit(key, 1, 1000).allowed).toBe(true);
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

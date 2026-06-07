import { describe, expect, it, vi } from "vitest";

// auth.ts pulls in next/headers (cookies) and the Prisma client at import time;
// neither is exercised by the token sign/verify helpers under test, so stub them
// to keep this a pure unit test.
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  signAccessToken,
  signRenderToken,
  signShareToken,
  verifyAccessToken,
  verifyRenderToken,
  verifyShareToken,
} from "./auth";

describe("access token", () => {
  it("round-trips a payload", async () => {
    const token = await signAccessToken({ userId: "u1", email: "a@b.com" });
    const payload = await verifyAccessToken(token);
    expect(payload?.userId).toBe("u1");
    expect(payload?.email).toBe("a@b.com");
  });

  it("rejects a tampered token", async () => {
    const token = await signAccessToken({ userId: "u1", email: "a@b.com" });
    expect(await verifyAccessToken(token + "x")).toBeNull();
  });
});

describe("share token", () => {
  it("round-trips the resource id", async () => {
    const token = await signShareToken("resume-1");
    expect(await verifyShareToken(token)).toBe("resume-1");
  });

  it("rejects garbage", async () => {
    expect(await verifyShareToken("not-a-jwt")).toBeNull();
  });
});

describe("render token", () => {
  it("validates only for the matching resource id", async () => {
    const token = await signRenderToken("resume-1");
    expect(await verifyRenderToken(token, "resume-1")).toBe(true);
    expect(await verifyRenderToken(token, "resume-2")).toBe(false);
  });

  it("does not accept a share token as a render token", async () => {
    const share = await signShareToken("resume-1");
    expect(await verifyRenderToken(share, "resume-1")).toBe(false);
  });
});

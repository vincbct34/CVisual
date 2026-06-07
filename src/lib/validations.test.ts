import { describe, expect, it } from "vitest";
import {
  importResumeSchema,
  loginSchema,
  registerSchema,
  resumeStyleSchema,
} from "./validations";

describe("registerSchema", () => {
  it("accepts a valid payload", () => {
    expect(
      registerSchema.safeParse({
        email: "a@b.com",
        password: "longenough",
        name: "Jo",
      }).success,
    ).toBe(true);
  });

  it("rejects bad email, short password, empty name", () => {
    expect(
      registerSchema.safeParse({
        email: "nope",
        password: "longenough",
        name: "Jo",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        email: "a@b.com",
        password: "short",
        name: "Jo",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        email: "a@b.com",
        password: "longenough",
        name: "",
      }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a valid email and 8+ char password", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "12345678" }).success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "1234" }).success,
    ).toBe(false);
  });
});

describe("resumeStyleSchema", () => {
  it("enforces fontSize bounds", () => {
    expect(resumeStyleSchema.safeParse({ fontSize: 14 }).success).toBe(true);
    expect(resumeStyleSchema.safeParse({ fontSize: 4 }).success).toBe(false);
    expect(resumeStyleSchema.safeParse({ fontSize: 99 }).success).toBe(false);
  });

  it("rejects unknown photoShape", () => {
    expect(
      resumeStyleSchema.safeParse({ photoShape: "triangle" }).success,
    ).toBe(false);
  });
});

describe("importResumeSchema", () => {
  const section = {
    type: "profile" as const,
    title: "Profil",
    content: { fullName: "x" },
  };

  it("accepts a minimal valid import", () => {
    expect(
      importResumeSchema.safeParse({ title: "CV", sections: [section] })
        .success,
    ).toBe(true);
  });

  it("rejects more than 30 sections", () => {
    const sections = Array.from({ length: 31 }, () => section);
    expect(
      importResumeSchema.safeParse({ title: "CV", sections }).success,
    ).toBe(false);
  });

  it("rejects an unknown section type", () => {
    expect(
      importResumeSchema.safeParse({
        title: "CV",
        sections: [{ ...section, type: "bogus" }],
      }).success,
    ).toBe(false);
  });
});

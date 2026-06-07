import { describe, expect, it } from "vitest";
import type { ProfileContent, ResumeStyle } from "@/types/resume";
import {
  accentTextOnLight,
  defaultSidebarTypes,
  getContactLines,
  getPhotoStyle,
  isHtml,
  readableTextColor,
  sanitize,
  withAlpha,
} from "./template-utils";

describe("color helpers", () => {
  it("withAlpha builds rgba and passes through invalid hex", () => {
    expect(withAlpha("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)");
    expect(withAlpha("nope", 0.5)).toBe("nope");
  });

  it("readableTextColor picks contrast against the background", () => {
    expect(readableTextColor("#000000")).toBe("#ffffff");
    expect(readableTextColor("#ffffff")).toBe("#1a1a1a");
  });

  it("accentTextOnLight keeps a usable hue, darkens near-white", () => {
    expect(accentTextOnLight("#2563eb")).toBe("#2563eb");
    expect(accentTextOnLight("#ffffff")).toBe("#1a1a1a");
  });
});

describe("getContactLines", () => {
  it("lists base fields then labelled custom fields", () => {
    const profile = {
      email: "a@b.com",
      phone: "0600",
      location: "",
      website: "",
      customFields: [
        { label: "GitHub", value: "gh/x" },
        { label: "", value: "" },
      ],
    } as unknown as ProfileContent;
    expect(getContactLines(profile)).toEqual([
      "a@b.com",
      "0600",
      "GitHub : gh/x",
    ]);
  });
});

describe("layout helpers", () => {
  it("defaultSidebarTypes varies by template", () => {
    expect([...defaultSidebarTypes("creative")]).toContain("interests");
    expect([...defaultSidebarTypes("modern")]).toEqual(["skills", "languages"]);
    expect([...defaultSidebarTypes("classic")]).toEqual([]);
  });

  it("getPhotoStyle only emits set properties", () => {
    expect(getPhotoStyle({} as ResumeStyle)).toEqual({});
    const s = getPhotoStyle({
      photoSize: 80,
      photoShape: "circle",
    } as ResumeStyle);
    expect(s.width).toBe("80px");
    expect(s.borderRadius).toBe("9999px");
  });
});

describe("isHtml", () => {
  it("detects tags", () => {
    expect(isHtml("<p>hi</p>")).toBe(true);
    expect(isHtml("plain text")).toBe(false);
  });
});

describe("sanitize", () => {
  it("keeps allowed tags and removes scripts/handlers", () => {
    const out = sanitize("<p>ok</p><script>alert(1)</script>");
    expect(out).toContain("<p>ok</p>");
    expect(out).not.toContain("script");
  });

  it("strips event-handler attributes", () => {
    const out = sanitize('<p onclick="evil()">x</p>');
    expect(out).not.toContain("onclick");
  });

  it("returns empty string for falsy input", () => {
    expect(sanitize("")).toBe("");
  });
});

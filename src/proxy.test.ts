import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";

import { config } from "./proxy";

describe("proxy matcher", () => {
  it("runs for dotted share tokens so bare share links can be localized", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        url: "/share/header.payload.signature",
      }),
    ).toBe(true);
  });

  it("continues to skip static assets with file extensions", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        url: "/logo.png",
      }),
    ).toBe(false);
  });
});

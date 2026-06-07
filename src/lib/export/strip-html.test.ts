import { describe, it, expect } from "vitest";
import { stripHtml } from "./strip-html";

describe("stripHtml", () => {
  it("returns empty string for empty input", () => {
    expect(stripHtml("")).toBe("");
  });

  it("turns block tags and <br> into newlines", () => {
    expect(stripHtml("<p>a</p><p>b</p>")).toBe("a\nb");
    expect(stripHtml("a<br>b")).toBe("a\nb");
    expect(stripHtml("<h2>Title</h2>")).toBe("Title");
  });

  it("prefixes list items with a bullet", () => {
    // Closing </li> is not a newline boundary, so items run together — this
    // documents the existing DOCX flattening behavior.
    expect(stripHtml("<ul><li>one</li><li>two</li></ul>")).toBe("• one• two");
  });

  it("strips remaining tags and decodes common entities", () => {
    expect(stripHtml("<strong>bold</strong> &amp; <em>x</em>")).toBe(
      "bold & x",
    );
    expect(stripHtml("a&nbsp;b &lt;c&gt;")).toBe("a b <c>");
  });

  it("collapses blank lines and trims", () => {
    expect(stripHtml("<p>a</p><p></p><p>b</p>")).toBe("a\nb");
  });
});

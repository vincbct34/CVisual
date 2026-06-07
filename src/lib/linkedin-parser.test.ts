import { describe, expect, it } from "vitest";
import { parseLinkedInText } from "./linkedin-parser";

// A minimal LinkedIn-export-shaped text: the profile block (name/title/location)
// comes before any section heading, matching pdf-parse output ordering.
const SAMPLE = `John Doe
Software Engineer
Paris, France
Contact
john@example.com
Top Skills
React
TypeScript
Summary
Experienced engineer.
Experience
Acme Inc
Senior Developer
janvier 2020 - Present
- Built things
Education
MIT
BSc Computer Science · 2015 - 2019
Languages
Anglais (Full Professional)`;

describe("parseLinkedInText", () => {
  const result = parseLinkedInText(SAMPLE);

  it("extracts the profile header", () => {
    expect(result.profile.fullName).toBe("John Doe");
    expect(result.profile.jobTitle).toBe("Software Engineer");
    expect(result.profile.location).toBe("Paris, France");
    expect(result.profile.email).toBe("john@example.com");
    expect(result.profile.summary).toContain("Experienced engineer");
  });

  it("extracts skills", () => {
    expect(result.skills.map((s) => s.name)).toEqual(["React", "TypeScript"]);
  });

  it("maps language levels to French labels", () => {
    expect(result.languages).toHaveLength(1);
    expect(result.languages[0]).toMatchObject({
      name: "Anglais",
      level: "Courant",
    });
  });

  it("anchors experience on the date range", () => {
    expect(result.experience).toHaveLength(1);
    expect(result.experience[0]).toMatchObject({
      company: "Acme Inc",
      position: "Senior Developer",
      startDate: "2020-01",
      current: true,
    });
  });

  it("parses education with degree and dates", () => {
    expect(result.education[0]).toMatchObject({
      institution: "MIT",
      degree: "BSc Computer Science",
      startDate: "2015-01",
      endDate: "2019-01",
    });
  });

  it("returns empty collections for empty input", () => {
    const empty = parseLinkedInText("");
    expect(empty.skills).toEqual([]);
    expect(empty.experience).toEqual([]);
  });
});

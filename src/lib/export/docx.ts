import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TabStopPosition,
  TabStopType,
  Packer,
  BorderStyle,
} from "docx";
import type { IRunOptions } from "docx";
import { stripHtml } from "./strip-html";
import type {
  Section,
  ProfileContent,
  ExperienceItem,
  EducationItem,
  SkillItem,
  LanguageItem,
  ProjectItem,
  CertificationItem,
  InterestItem,
  ResumeStyle,
} from "@/types/resume";

function getProfile(sections: Section[]): ProfileContent {
  const s = sections.find((s) => s.type === "profile");
  return (
    (s?.content as unknown as ProfileContent) ?? {
      fullName: "",
      jobTitle: "",
      summary: "",
      email: "",
      phone: "",
      location: "",
      website: "",
    }
  );
}

function getItems<T>(sections: Section[], type: string): T[] {
  const s = sections.find((s) => s.type === type);
  const content = s?.content as Record<string, unknown> | undefined;
  return (content?.items as T[]) ?? [];
}

function getVisibleSections(sections: Section[]): Section[] {
  return sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);
}

function createRichTextRuns(
  text: string,
  options: Omit<IRunOptions, "text" | "break">,
): TextRun[] {
  const runs: TextRun[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    runs.push(
      new TextRun({
        ...options,
        text: lines[i],
        break: i > 0 ? 1 : 0,
      }),
    );
  }
  return runs;
}

function formatDate(date: string): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

function hexToRgb(hex: string): string {
  return hex.replace("#", "");
}

// Darken a near-white accent so headings stay legible on the white page.
function clampLightHex(hex: string): string {
  const h = (hex || "").replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (full.length !== 6 || /[^0-9a-fA-F]/.test(full)) return hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.8 ? "#1a1a1a" : `#${full}`;
}

function dateLine(
  startDate: string,
  endDate: string,
  current: boolean,
): string {
  const start = formatDate(startDate);
  const end = current ? "Présent" : formatDate(endDate);
  return `${start} — ${end}`;
}

function sectionHeading(title: string, color: string, headMult = 1): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: hexToRgb(color) },
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: Math.round(22 * headMult),
        color: hexToRgb(color),
        font: "Calibri",
      }),
    ],
  });
}

/**
 * DOCX is a clean, *editable* rendering of the CV — one consistent layout, not a
 * pixel replica of the chosen on-screen template. (Word has no flexbox/grid, so
 * template-exact reproduction isn't possible; PDF/PNG is the exact export.)
 */
export async function generateDOCX(
  sections: Section[],
  style: ResumeStyle,
  _title: string,
): Promise<Uint8Array> {
  const profile = getProfile(sections);
  const visible = getVisibleSections(sections);
  const accent = clampLightHex(style.primaryColor);
  const color = hexToRgb(accent);

  // Size multipliers mirroring the editor's three groups. Body tracks the
  // chosen base font size (relative to the 14px default); headings and
  // dates/meta scale on top via their own sliders.
  const headMult = style.headingScale ?? 1;
  const metaMult = style.metaScale ?? 1;
  const bodyMult = (style.fontSize || 14) / 14;
  const head = (n: number) => Math.round(n * headMult);
  const meta = (n: number) => Math.round(n * metaMult);
  const body = (n: number) => Math.round(n * bodyMult);

  const paragraphs: Paragraph[] = [];

  // Header
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: profile.fullName || "Votre Nom",
          bold: true,
          size: head(36),
          color,
          font: "Calibri",
        }),
      ],
    }),
  );

  if (profile.jobTitle) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: profile.jobTitle,
            size: head(22),
            color: "666666",
            font: "Calibri",
          }),
        ],
      }),
    );
  }

  const contactParts = [
    profile.email,
    profile.phone,
    profile.location,
    profile.website,
    ...(profile.customFields ?? [])
      .filter((f) => f.value?.trim())
      .map((f) =>
        f.label?.trim()
          ? `${f.label.trim()} : ${f.value.trim()}`
          : f.value.trim(),
      ),
  ].filter(Boolean);
  if (contactParts.length) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: contactParts.join(" | "),
            size: meta(18),
            color: "888888",
            font: "Calibri",
          }),
        ],
      }),
    );
  }

  if (profile.summary) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          ...createRichTextRuns(stripHtml(profile.summary), {
            size: body(20),
            color: "555555",
            font: "Calibri",
          }),
        ],
      }),
    );
  }

  // Sections
  for (const section of visible) {
    if (section.type === "profile") continue;

    switch (section.type) {
      case "experience": {
        const items = getItems<ExperienceItem>(sections, "experience");
        if (items.length === 0) break;
        paragraphs.push(sectionHeading(section.title, accent, headMult));
        for (const item of items) {
          paragraphs.push(
            new Paragraph({
              tabStops: [
                { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
              ],
              spacing: { before: 100 },
              children: [
                new TextRun({
                  text: item.position,
                  bold: true,
                  size: body(21),
                  font: "Calibri",
                }),
                new TextRun({
                  text: `\t${dateLine(item.startDate, item.endDate, item.current)}`,
                  size: meta(18),
                  color: "888888",
                  font: "Calibri",
                }),
              ],
            }),
          );
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: item.company,
                  size: body(20),
                  color: "555555",
                  font: "Calibri",
                }),
              ],
            }),
          );
          if (item.description) {
            paragraphs.push(
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  ...createRichTextRuns(stripHtml(item.description), {
                    size: body(19),
                    color: "444444",
                    font: "Calibri",
                  }),
                ],
              }),
            );
          }
        }
        break;
      }
      case "education": {
        const items = getItems<EducationItem>(sections, "education");
        if (items.length === 0) break;
        paragraphs.push(sectionHeading(section.title, accent, headMult));
        for (const item of items) {
          paragraphs.push(
            new Paragraph({
              tabStops: [
                { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
              ],
              spacing: { before: 100 },
              children: [
                new TextRun({
                  text: `${item.degree} — ${item.field}`,
                  bold: true,
                  size: body(21),
                  font: "Calibri",
                }),
                new TextRun({
                  text: `\t${formatDate(item.startDate)} — ${formatDate(item.endDate)}`,
                  size: meta(18),
                  color: "888888",
                  font: "Calibri",
                }),
              ],
            }),
          );
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: item.institution,
                  size: body(20),
                  color: "555555",
                  font: "Calibri",
                }),
              ],
            }),
          );
          if (item.description) {
            paragraphs.push(
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  ...createRichTextRuns(stripHtml(item.description), {
                    size: body(19),
                    color: "444444",
                    font: "Calibri",
                  }),
                ],
              }),
            );
          }
        }
        break;
      }
      case "skills": {
        const items = getItems<SkillItem>(sections, "skills");
        if (items.length === 0) break;
        paragraphs.push(sectionHeading(section.title, accent, headMult));
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: items.map((i) => i.name).join(" · "),
                size: body(20),
                font: "Calibri",
              }),
            ],
          }),
        );
        break;
      }
      case "languages": {
        const items = getItems<LanguageItem>(sections, "languages");
        if (items.length === 0) break;
        paragraphs.push(sectionHeading(section.title, accent, headMult));
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: items.map((i) => `${i.name} (${i.level})`).join(" · "),
                size: body(20),
                font: "Calibri",
              }),
            ],
          }),
        );
        break;
      }
      case "projects": {
        const items = getItems<ProjectItem>(sections, "projects");
        if (items.length === 0) break;
        paragraphs.push(sectionHeading(section.title, accent, headMult));
        for (const item of items) {
          paragraphs.push(
            new Paragraph({
              spacing: { before: 80 },
              children: [
                new TextRun({
                  text: item.name,
                  bold: true,
                  size: body(21),
                  font: "Calibri",
                }),
              ],
            }),
          );
          if (item.description) {
            paragraphs.push(
              new Paragraph({
                children: [
                  ...createRichTextRuns(stripHtml(item.description), {
                    size: body(19),
                    color: "444444",
                    font: "Calibri",
                  }),
                ],
              }),
            );
          }
          if (item.technologies) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Technologies : ${item.technologies}`,
                    size: meta(18),
                    color: "888888",
                    font: "Calibri",
                  }),
                ],
              }),
            );
          }
        }
        break;
      }
      case "certifications": {
        const items = getItems<CertificationItem>(sections, "certifications");
        if (items.length === 0) break;
        paragraphs.push(sectionHeading(section.title, accent, headMult));
        for (const item of items) {
          paragraphs.push(
            new Paragraph({
              tabStops: [
                { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
              ],
              children: [
                new TextRun({
                  text: `${item.name} — ${item.issuer}`,
                  size: body(20),
                  font: "Calibri",
                }),
                new TextRun({
                  text: `\t${formatDate(item.date)}`,
                  size: meta(18),
                  color: "888888",
                  font: "Calibri",
                }),
              ],
            }),
          );
        }
        break;
      }
      case "interests": {
        const items = getItems<InterestItem>(sections, "interests");
        if (items.length === 0) break;
        paragraphs.push(sectionHeading(section.title, accent, headMult));
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: items.map((i) => i.name).join(" · "),
                size: body(20),
                font: "Calibri",
              }),
            ],
          }),
        );
        break;
      }
      default: {
        // Custom section in "list" mode: dot-joined item names (like skills).
        if (section.content?.mode === "list") {
          const items =
            (section.content?.items as { name: string }[] | undefined) ?? [];
          if (items.length === 0) break;
          paragraphs.push(sectionHeading(section.title, accent, headMult));
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: items
                    .map((i) => i.name)
                    .filter(Boolean)
                    .join(" · "),
                  size: body(20),
                  font: "Calibri",
                }),
              ],
            }),
          );
          break;
        }
        const text = (section.content?.text as string) ?? "";
        if (!text) break;
        paragraphs.push(sectionHeading(section.title, accent, headMult));
        paragraphs.push(
          new Paragraph({
            children: [
              ...createRichTextRuns(stripHtml(text), {
                size: body(20),
                font: "Calibri",
              }),
            ],
          }),
        );
        break;
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

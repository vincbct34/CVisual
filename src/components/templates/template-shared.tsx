import {
  isHtml,
  sanitize,
  formatDate,
  getExperiences,
  getEducation,
  getSkills,
  getLanguages,
  getProjects,
  getCertifications,
  getInterests,
  readableTextColor,
  withAlpha,
  FS,
} from "./template-utils";
import type { CSSProperties } from "react";
import type { Section } from "@/types/resume";

/**
 * Renders Tiptap rich-text HTML (sanitized) or falls back to plain text with
 * preserved line breaks. List styling is applied inline so it survives both the
 * editor preview and the Puppeteer/HTML export paths.
 */
export function RichText({
  html,
  className = "",
  style,
}: {
  html: string;
  className?: string;
  style?: CSSProperties;
}) {
  if (!html) return null;

  const listStyles =
    "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:underline";

  if (isHtml(html)) {
    return (
      <div
        className={`${className} ${listStyles}`}
        style={style}
        dangerouslySetInnerHTML={{ __html: sanitize(html) }}
      />
    );
  }

  return (
    <p className={`${className} whitespace-pre-line`} style={style}>
      {html}
    </p>
  );
}

/**
 * Visual 1–5 skill level indicator (filled / empty dots).
 */
export function SkillDots({ level, color }: { level: number; color: string }) {
  const lvl = Math.max(0, Math.min(5, level || 0));
  return (
    <span className="inline-flex gap-1 shrink-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: i <= lvl ? color : withAlpha(color, 0.25) }}
        />
      ))}
    </span>
  );
}

/**
 * Horizontal skill level bar (used by sidebar layouts).
 */
export function SkillBar({
  level,
  color,
  track,
}: {
  level: number;
  color: string;
  track?: string;
}) {
  const pct = (Math.max(0, Math.min(5, level || 0)) / 5) * 100;
  return (
    <span
      className="block h-1.5 w-full rounded-full"
      style={{ backgroundColor: track ?? withAlpha(color, 0.2) }}
    >
      <span
        className="block h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </span>
  );
}

/**
 * Structural wrapper for one entry (a job, a diploma…). Intentionally does NOT
 * force `break-inside-avoid`: the PDF print pagination should break at the same
 * fine-grained text boundaries (paragraphs / list items) as the editor's paged
 * preview, so an entry may split across pages instead of leaving a large blank
 * gap. Line-level breaks are guarded by print CSS on the render page.
 */
export function Entry({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

/**
 * Renders the *body* (items) of any section type with neutral, export-safe
 * Tailwind. Templates own the heading + page layout; this owns item markup so
 * every template handles all 9 section types identically. Returns null when the
 * section has no renderable content.
 *
 * `skillStyle`:
 *   - "dots"  → inline name + 5-dot level (single-column templates)
 *   - "bar"   → name above a full-width progress bar (sidebar templates)
 *   - "chip"  → pill badges, no level (compact templates)
 */
/**
 * True when a section has something worth rendering — lets templates skip the
 * heading entirely for empty sections instead of leaving a dangling title.
 */
export function sectionHasContent(
  section: Section,
  sections: Section[],
): boolean {
  switch (section.type) {
    case "experience":
      return getExperiences(sections).length > 0;
    case "education":
      return getEducation(sections).length > 0;
    case "skills":
      return getSkills(sections).length > 0;
    case "languages":
      return getLanguages(sections).length > 0;
    case "projects":
      return getProjects(sections).length > 0;
    case "certifications":
      return getCertifications(sections).length > 0;
    case "interests":
      return getInterests(sections).length > 0;
    default:
      if (section.content?.mode === "list") {
        return (
          ((section.content?.items as unknown[] | undefined)?.length ?? 0) > 0
        );
      }
      return Boolean((section.content?.text as string)?.trim());
  }
}

/**
 * Renders a list of leveled items (name + 1-5 level) in one of four styles.
 * Shared by the skills section and custom sections in "list" mode.
 */
function LeveledItemsList({
  items,
  display,
  color,
}: {
  items: { id: string; name: string; level: number }[];
  display: string;
  color: string;
}) {
  if (!items.length) return null;
  if (display === "tags" || display === "chip") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item.id}
            className="px-2.5 py-0.5 rounded-md text-xs max-w-full [overflow-wrap:anywhere]"
            style={{
              backgroundColor: color,
              color: readableTextColor(color),
              fontSize: FS.bodySm,
            }}
          >
            {item.name}
          </span>
        ))}
      </div>
    );
  }
  if (display === "text") {
    return (
      <p className="text-sm leading-relaxed" style={{ fontSize: FS.body }}>
        {items
          .map((item) => item.name)
          .filter(Boolean)
          .join(" · ")}
      </p>
    );
  }
  if (display === "bar") {
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="space-y-1">
            <span className="text-sm" style={{ fontSize: FS.body }}>
              {item.name}
            </span>
            <SkillBar level={item.level} color={color} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-2">
          <span className="text-sm" style={{ fontSize: FS.body }}>
            {item.name}
          </span>
          <SkillDots level={item.level} color={color} />
        </div>
      ))}
    </div>
  );
}

export function SectionContent({
  section,
  sections,
  color,
  skillStyle = "dots",
}: {
  section: Section;
  sections: Section[];
  color: string;
  skillStyle?: "dots" | "bar" | "chip";
}) {
  switch (section.type) {
    case "experience": {
      const items = getExperiences(sections);
      if (!items.length) return null;
      return (
        <div className="space-y-3">
          {items.map((item) => (
            <Entry key={item.id}>
              <div className="flex justify-between items-baseline gap-3">
                <p
                  className="font-semibold leading-tight"
                  style={{ fontSize: FS.body }}
                >
                  {item.position}
                </p>
                <p
                  className="text-xs opacity-70 whitespace-nowrap"
                  style={{ fontSize: FS.meta }}
                >
                  {formatDate(item.startDate)} —{" "}
                  {item.current ? "Présent" : formatDate(item.endDate)}
                </p>
              </div>
              {item.company && (
                <p
                  className="text-sm opacity-80"
                  style={{ fontSize: FS.bodySm }}
                >
                  {item.company}
                </p>
              )}
              <RichText
                html={item.description}
                className="text-sm mt-1 opacity-90 leading-snug"
                style={{ fontSize: FS.bodySm }}
              />
            </Entry>
          ))}
        </div>
      );
    }
    case "education": {
      const items = getEducation(sections);
      if (!items.length) return null;
      return (
        <div className="space-y-3">
          {items.map((item) => (
            <Entry key={item.id}>
              <div className="flex justify-between items-baseline gap-3">
                <p
                  className="font-semibold leading-tight"
                  style={{ fontSize: FS.body }}
                >
                  {[item.degree, item.field].filter(Boolean).join(" — ")}
                </p>
                <p
                  className="text-xs opacity-70 whitespace-nowrap"
                  style={{ fontSize: FS.meta }}
                >
                  {formatDate(item.startDate)} — {formatDate(item.endDate)}
                </p>
              </div>
              {item.institution && (
                <p
                  className="text-sm opacity-80"
                  style={{ fontSize: FS.bodySm }}
                >
                  {item.institution}
                </p>
              )}
              <RichText
                html={item.description}
                className="text-sm mt-1 opacity-90 leading-snug"
                style={{ fontSize: FS.bodySm }}
              />
            </Entry>
          ))}
        </div>
      );
    }
    case "skills": {
      const items = getSkills(sections);
      if (!items.length) return null;
      // User choice (section.content.display) overrides the template default.
      const display = (section.content?.display as string) || skillStyle;
      return <LeveledItemsList items={items} display={display} color={color} />;
    }
    case "languages": {
      const items = getLanguages(sections);
      if (!items.length) return null;
      return (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-sm gap-2"
              style={{ fontSize: FS.body }}
            >
              <span className="font-medium">{item.name}</span>
              <span className="opacity-70">{item.level}</span>
            </div>
          ))}
        </div>
      );
    }
    case "projects": {
      const items = getProjects(sections);
      if (!items.length) return null;
      return (
        <div className="space-y-3">
          {items.map((item) => (
            <Entry key={item.id}>
              <p
                className="font-semibold leading-tight"
                style={{ fontSize: FS.body }}
              >
                {item.name}
              </p>
              <RichText
                html={item.description}
                className="text-sm opacity-90 leading-snug"
                style={{ fontSize: FS.bodySm }}
              />
              {item.technologies && (
                <p
                  className="text-xs opacity-60 mt-0.5"
                  style={{ fontSize: FS.meta }}
                >
                  {item.technologies}
                </p>
              )}
            </Entry>
          ))}
        </div>
      );
    }
    case "certifications": {
      const items = getCertifications(sections);
      if (!items.length) return null;
      return (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-baseline gap-3 text-sm"
              style={{ fontSize: FS.body }}
            >
              <span>
                <span className="font-medium">{item.name}</span>
                {item.issuer && (
                  <span className="opacity-70"> — {item.issuer}</span>
                )}
              </span>
              <span
                className="text-xs opacity-60 whitespace-nowrap"
                style={{ fontSize: FS.meta }}
              >
                {formatDate(item.date)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    case "interests": {
      const items = getInterests(sections);
      if (!items.length) return null;
      return (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item.id}
              className="px-2.5 py-0.5 rounded-md text-xs bg-black/5 max-w-full [overflow-wrap:anywhere]"
              style={{ fontSize: FS.bodySm }}
            >
              {item.name}
            </span>
          ))}
        </div>
      );
    }
    default: {
      // Custom section: either a leveled item list or free rich text.
      if (section.content?.mode === "list") {
        const items =
          (section.content?.items as
            | { id: string; name: string; level: number }[]
            | undefined) ?? [];
        const display = (section.content?.display as string) || "dots";
        return (
          <LeveledItemsList items={items} display={display} color={color} />
        );
      }
      const text = (section.content?.text as string) ?? "";
      if (!text) return null;
      return (
        <RichText
          html={text}
          className="text-sm opacity-90"
          style={{ fontSize: FS.bodySm }}
        />
      );
    }
  }
}

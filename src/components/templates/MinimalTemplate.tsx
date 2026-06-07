import type { TemplateProps } from "@/types/resume";
import {
  getProfile,
  getVisibleSections,
  getContactLines,
  accentTextOnLight,
  getRootFontStyle,
  FS,
} from "./template-utils";
import { RichText, SectionContent, sectionHasContent } from "./template-shared";

export function MinimalTemplate({ resume }: TemplateProps) {
  const { style, sections } = resume;
  const profile = getProfile(sections);
  const visible = getVisibleSections(sections).filter(
    (s) => s.type !== "profile",
  );
  const accent = accentTextOnLight(style.primaryColor);

  const contacts = getContactLines(profile);

  return (
    <div
      className="bg-white text-gray-900 w-full min-h-full"
      style={getRootFontStyle(style)}
    >
      <header className="px-12 pt-12 pb-8">
        <h1
          className="text-4xl font-light tracking-tight"
          style={{ fontSize: FS.nameLg }}
        >
          {profile.fullName || "Votre Nom"}
        </h1>
        {profile.jobTitle && (
          <p
            className="text-base mt-1 font-medium"
            style={{ color: accent, fontSize: FS.subtitleSm }}
          >
            {profile.jobTitle}
          </p>
        )}
        {contacts.length > 0 && (
          <div
            className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-3"
            style={{ fontSize: FS.meta }}
          >
            {contacts.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        )}
        <RichText
          html={profile.summary}
          className="text-sm text-gray-600 leading-relaxed mt-5 max-w-2xl"
          style={{ fontSize: FS.bodySm }}
        />
      </header>

      <main className="px-12 pb-12 space-y-7">
        {visible.map((section) => {
          if (!sectionHasContent(section, sections)) return null;
          // Block flow (not CSS grid): a grid container can't be fragmented
          // across PDF pages by Chromium, so a tall section would jump whole to
          // the next page and leave a large blank. The title is an absolute
          // left label; the content flows normally and paginates cleanly.
          return (
            <section key={section.id} className="relative pl-[164px]">
              <h2
                className="absolute left-0 top-[2px] w-[140px] text-xs font-semibold uppercase tracking-[0.15em] text-gray-400"
                style={{ fontSize: FS.headingXs }}
              >
                {section.title}
              </h2>
              <SectionContent
                section={section}
                sections={sections}
                color={accent}
              />
            </section>
          );
        })}
      </main>
    </div>
  );
}

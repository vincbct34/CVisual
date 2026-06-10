import type { TemplateProps } from "@/types/resume";
import {
  getProfile,
  getVisibleSections,
  getPhotoStyle,
  getContactLines,
  accentTextOnLight,
  getRootFontStyle,
  FS,
} from "./template-utils";
import { RichText, SectionContent, sectionHasContent } from "./template-shared";

export function ClassicTemplate({ resume }: TemplateProps) {
  const { style, sections } = resume;
  const profile = getProfile(sections);
  const visible = getVisibleSections(sections).filter(
    (s) => s.type !== "profile",
  );
  const accent = style.primaryColor;
  const accentText = accentTextOnLight(accent);

  const contacts = getContactLines(profile);

  return (
    <div
      className="cv-root bg-white text-gray-800 w-full min-h-full"
      style={getRootFontStyle(style)}
    >
      <header
        className="text-center px-10 pt-10 pb-6"
        style={{ borderBottom: `3px solid ${accent}` }}
      >
        {profile.photoBase64 && (
          <img
            src={profile.photoBase64}
            alt={profile.fullName || "Photo"}
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            style={{ ...getPhotoStyle(style), border: `2px solid ${accent}` }}
          />
        )}
        <h1
          className="text-3xl font-bold"
          style={{ color: accentText, fontSize: FS.name }}
        >
          {profile.fullName || "Votre Nom"}
        </h1>
        {profile.jobTitle && (
          <p
            className="text-lg text-gray-600 mt-1"
            style={{ fontSize: FS.subtitle }}
          >
            {profile.jobTitle}
          </p>
        )}
        {contacts.length > 0 && (
          <div
            className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-3"
            style={{ fontSize: FS.meta }}
          >
            {contacts.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        )}
        <RichText
          html={profile.summary}
          className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed mt-4"
          style={{ fontSize: FS.bodySm }}
        />
      </header>

      <main className="px-10 py-7 space-y-6">
        {visible.map((section) => {
          if (!sectionHasContent(section, sections)) return null;
          return (
            <section key={section.id}>
              <h2
                className="text-base font-bold uppercase tracking-wide mb-3 pb-1"
                style={{
                  color: accentText,
                  borderBottom: `2px solid ${accent}`,
                  fontSize: FS.heading,
                }}
              >
                {section.title}
              </h2>
              <SectionContent
                section={section}
                sections={sections}
                color={accentText}
              />
            </section>
          );
        })}
      </main>
    </div>
  );
}

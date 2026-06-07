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

export function ProfessionalTemplate({ resume }: TemplateProps) {
  const { style, sections } = resume;
  const profile = getProfile(sections);
  const visible = getVisibleSections(sections).filter(
    (s) => s.type !== "profile",
  );
  const accent = accentTextOnLight(style.primaryColor);

  const contacts = getContactLines(profile);

  return (
    <div
      className="bg-white text-gray-800 w-full min-h-full"
      style={getRootFontStyle(style)}
    >
      <header className="px-12 pt-10 pb-5">
        <div className="flex items-center gap-5">
          {profile.photoBase64 && (
            <img
              src={profile.photoBase64}
              alt={profile.fullName || "Photo"}
              className="w-20 h-20 rounded object-cover shrink-0"
              style={getPhotoStyle(style)}
            />
          )}
          <div className="min-w-0">
            <h1
              className="text-3xl font-bold tracking-tight text-gray-900"
              style={{ fontSize: FS.name }}
            >
              {profile.fullName || "Votre Nom"}
            </h1>
            {profile.jobTitle && (
              <p
                className="text-base text-gray-600 mt-0.5"
                style={{ fontSize: FS.subtitleSm }}
              >
                {profile.jobTitle}
              </p>
            )}
          </div>
        </div>
        {contacts.length > 0 && (
          <div
            className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mt-4 pt-3"
            style={{ borderTop: `1px solid ${accent}`, fontSize: FS.meta }}
          >
            {contacts.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        )}
      </header>

      <main className="px-12 pb-12 space-y-5">
        {profile.summary && (
          <section>
            <RichText
              html={profile.summary}
              className="text-sm text-gray-700 leading-relaxed"
              style={{ fontSize: FS.bodySm }}
            />
          </section>
        )}
        {visible.map((section) => {
          if (!sectionHasContent(section, sections)) return null;
          return (
            <section key={section.id}>
              <h2
                className="text-sm font-bold uppercase tracking-wider mb-2.5 pb-1 text-gray-900"
                style={{
                  borderBottom: `1.5px solid ${accent}`,
                  fontSize: FS.headingSm,
                }}
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

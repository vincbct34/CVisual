import type { TemplateProps } from "@/types/resume";
import {
  getProfile,
  getVisibleSections,
  getPhotoStyle,
  getContactLines,
  defaultSidebarTypes,
  isSidebarSection,
  readableTextColor,
  accentTextOnLight,
  getRootFontStyle,
  FS,
} from "./template-utils";
import { RichText, SectionContent, sectionHasContent } from "./template-shared";

function Heading({ title, accent }: { title: string; accent: string }) {
  return (
    <h2
      className="text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-2"
      style={{ fontSize: FS.headingSm }}
    >
      <span
        className="inline-block h-3 w-1.5 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <span style={{ color: accent }}>{title}</span>
    </h2>
  );
}

export function CreativeTemplate({ resume }: TemplateProps) {
  const { style, sections } = resume;
  const profile = getProfile(sections);
  const visible = getVisibleSections(sections).filter(
    (s) => s.type !== "profile",
  );
  const accent = style.primaryColor;
  const accentText = accentTextOnLight(accent);
  const defaults = defaultSidebarTypes("creative");
  const sidebar = visible.filter((s) => isSidebarSection(s, style, defaults));
  const main = visible.filter((s) => !isSidebarSection(s, style, defaults));

  const contacts = getContactLines(profile);

  return (
    <div
      className="cv-root text-gray-800 w-full flex flex-col min-h-full"
      style={getRootFontStyle(style)}
    >
      {/* Header band */}
      <header
        className="px-10 py-8 flex items-center gap-6"
        style={{ backgroundColor: accent, color: readableTextColor(accent) }}
      >
        {profile.photoBase64 && (
          <img
            src={profile.photoBase64}
            alt={profile.fullName || "Photo"}
            className="w-24 h-24 rounded-full object-cover border-2 border-white/50 shrink-0"
            style={getPhotoStyle(style)}
          />
        )}
        <div className="min-w-0">
          <h1
            className="text-4xl font-extrabold leading-none"
            style={{ fontSize: FS.nameLg }}
          >
            {profile.fullName || "Votre Nom"}
          </h1>
          {profile.jobTitle && (
            <p
              className="text-lg opacity-90 mt-1"
              style={{ fontSize: FS.subtitle }}
            >
              {profile.jobTitle}
            </p>
          )}
          {contacts.length > 0 && (
            <div
              className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-90 mt-3"
              style={{ fontSize: FS.meta }}
            >
              {contacts.map((c, i) => (
                <span key={i}>{c}</span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Main */}
        <main className="flex-1 bg-white px-8 py-7 space-y-6 min-w-0">
          {profile.summary && (
            <section>
              <Heading title="Profil" accent={accentText} />
              <RichText
                html={profile.summary}
                className="text-sm text-gray-600 leading-relaxed"
                style={{ fontSize: FS.bodySm }}
              />
            </section>
          )}
          {main.map((section) => {
            if (!sectionHasContent(section, sections)) return null;
            return (
              <section key={section.id}>
                <Heading title={section.title} accent={accentText} />
                <SectionContent
                  section={section}
                  sections={sections}
                  color={accentText}
                />
              </section>
            );
          })}
        </main>

        {/* Sidebar */}
        {sidebar.some((s) => sectionHasContent(s, sections)) && (
          <aside className="w-[30%] shrink-0 bg-gray-50 px-6 py-7 space-y-6">
            {sidebar.map((section) => {
              if (!sectionHasContent(section, sections)) return null;
              return (
                <div key={section.id}>
                  <Heading title={section.title} accent={accentText} />
                  <SectionContent
                    section={section}
                    sections={sections}
                    color={accentText}
                    skillStyle="chip"
                  />
                </div>
              );
            })}
          </aside>
        )}
      </div>
    </div>
  );
}

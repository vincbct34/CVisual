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

export function ModernTemplate({ resume }: TemplateProps) {
  const { style, sections } = resume;
  const profile = getProfile(sections);
  const visible = getVisibleSections(sections).filter(
    (s) => s.type !== "profile",
  );
  const accent = style.primaryColor;
  const accentText = accentTextOnLight(accent);
  const sidebarText = readableTextColor(accent);
  const defaults = defaultSidebarTypes("modern");
  const sidebar = visible.filter((s) => isSidebarSection(s, style, defaults));
  const main = visible.filter((s) => !isSidebarSection(s, style, defaults));

  const contacts = getContactLines(profile);

  return (
    <div
      className="cv-root text-gray-800 w-full flex min-h-full"
      style={getRootFontStyle(style)}
    >
      {/* Sidebar */}
      <aside
        className="w-[34%] shrink-0 px-6 py-8 space-y-6"
        style={{ backgroundColor: accent, color: sidebarText }}
      >
        {profile.photoBase64 && (
          <img
            src={profile.photoBase64}
            alt={profile.fullName || "Photo"}
            className="w-28 h-28 rounded-full mx-auto object-cover border-2 border-white/40"
            style={getPhotoStyle(style)}
          />
        )}
        {contacts.length > 0 && (
          <div className="space-y-1.5">
            <h2
              className="text-xs font-bold uppercase tracking-widest border-b border-white/30 pb-1 mb-2"
              style={{ fontSize: FS.headingXs }}
            >
              Contact
            </h2>
            {contacts.map((c, i) => (
              <p
                key={i}
                className="text-xs break-words opacity-90"
                style={{ fontSize: FS.meta }}
              >
                {c}
              </p>
            ))}
          </div>
        )}
        {sidebar.map((section) => {
          if (!sectionHasContent(section, sections)) return null;
          return (
            <div key={section.id}>
              <h2
                className="text-xs font-bold uppercase tracking-widest border-b border-white/30 pb-1 mb-2"
                style={{ fontSize: FS.headingXs }}
              >
                {section.title}
              </h2>
              <SectionContent
                section={section}
                sections={sections}
                color={sidebarText}
                skillStyle="bar"
              />
            </div>
          );
        })}
      </aside>

      {/* Main */}
      <main className="flex-1 bg-white px-8 py-8 space-y-6 min-w-0">
        <header>
          <h1
            className="text-3xl font-bold"
            style={{ color: accentText, fontSize: FS.name }}
          >
            {profile.fullName || "Votre Nom"}
          </h1>
          {profile.jobTitle && (
            <p
              className="text-lg text-gray-600"
              style={{ fontSize: FS.subtitle }}
            >
              {profile.jobTitle}
            </p>
          )}
          <RichText
            html={profile.summary}
            className="text-sm text-gray-600 leading-relaxed mt-3"
            style={{ fontSize: FS.bodySm }}
          />
        </header>
        {main.map((section) => {
          if (!sectionHasContent(section, sections)) return null;
          return (
            <section key={section.id}>
              <h2
                className="text-base font-bold uppercase tracking-wide mb-3"
                style={{ color: accentText, fontSize: FS.heading }}
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

"use client";

import { Label } from "@/components/ui/label";
import { TEMPLATES } from "@/components/templates";
import { defaultSidebarTypes } from "@/components/templates/template-utils";
import { useT } from "@/components/i18n/language-provider";
import type { ResumeStyle, PhotoShape, Section } from "@/types/resume";
import {
  ColorPresetPicker,
  FontSelect,
  FontSizeControls,
  OptionButtons,
  SliderField,
  type ColorPreset,
} from "./style-controls";

const DEFAULT_PHOTO_SIZE = 96;

const PHOTO_SHAPE_KEYS: { value: PhotoShape; key: string }[] = [
  { value: "circle", key: "style.shapeCircle" },
  { value: "rounded", key: "style.shapeRounded" },
  { value: "square", key: "style.shapeSquare" },
];

const FONTS = [
  "Inter",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Helvetica",
  "Verdana",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
];

const COLOR_PRESET_DEFS: { primary: string; key: string }[] = [
  { primary: "#2563eb", key: "colors.bleu" },
  { primary: "#059669", key: "colors.vert" },
  { primary: "#dc2626", key: "colors.rouge" },
  { primary: "#7c3aed", key: "colors.violet" },
  { primary: "#ea580c", key: "colors.orange" },
  { primary: "#0891b2", key: "colors.cyan" },
  { primary: "#374151", key: "colors.gris" },
  { primary: "#000000", key: "colors.noir" },
];

interface StylePanelProps {
  template: string;
  style: ResumeStyle;
  sections?: Section[];
  onTemplateChange: (template: string) => void;
  onStyleChange: (style: ResumeStyle) => void;
}

export function StylePanel({
  template,
  style,
  sections,
  onTemplateChange,
  onStyleChange,
}: StylePanelProps) {
  const t = useT();
  const photoShapes = PHOTO_SHAPE_KEYS.map((s) => ({
    value: s.value,
    label: t(s.key),
  }));
  const colorPresets: ColorPreset[] = COLOR_PRESET_DEFS.map((c) => ({
    primary: c.primary,
    label: t(c.key),
  }));
  const hasSidebar = template === "modern" || template === "creative";
  const layoutSections = (sections ?? []).filter((s) => s.type !== "profile");
  const sidebarDefaults = defaultSidebarTypes(template);
  const inSidebar = (s: Section) =>
    style.sidebarSections
      ? style.sidebarSections.includes(s.id)
      : sidebarDefaults.has(s.type);

  function toggleSidebar(id: string) {
    const current = layoutSections.filter(inSidebar).map((s) => s.id);
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onStyleChange({ ...style, sidebarSections: next });
  }

  return (
    <div className="space-y-5">
      {/* Template selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("style.template")}</Label>
        <OptionButtons
          options={Object.keys(TEMPLATES).map((key) => ({
            value: key,
            label: t(`templateNames.${key}`),
          }))}
          value={template}
          onChange={onTemplateChange}
        />
      </div>

      {/* Sidebar layout (modern / creative) */}
      {hasSidebar && layoutSections.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("style.sidebar")}</Label>
          <p className="text-[11px] text-muted-foreground -mt-1">
            {t("style.sidebarHelp")}
          </p>
          <div className="space-y-1.5">
            {layoutSections.map((s) => {
              const active = inSidebar(s);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSidebar(s.id)}
                  className="flex w-full items-center justify-between rounded border px-2.5 py-1.5 text-xs transition-colors"
                  style={{
                    background: active
                      ? "var(--accent-soft)"
                      : "var(--card-bg)",
                    borderColor: active
                      ? "var(--accent-strong)"
                      : "var(--input-border)",
                    color: "var(--fg)",
                  }}
                >
                  <span className="truncate">{s.title}</span>
                  <span
                    className="shrink-0 font-medium"
                    style={{
                      color: active
                        ? "var(--accent-violet)"
                        : "var(--fg-muted)",
                    }}
                  >
                    {active ? t("style.sidebarCol") : t("style.mainCol")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color presets */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("style.color")}</Label>
        <ColorPresetPicker
          style={style}
          presets={colorPresets}
          onChange={onStyleChange}
        />
      </div>

      {/* Font */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("style.font")}</Label>
        <FontSelect style={style} fonts={FONTS} onChange={onStyleChange} />
      </div>

      {/* Font sizes — body / headings / meta */}
      <FontSizeControls style={style} onChange={onStyleChange} />

      {/* Profile photo */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("style.photo")}</Label>

        <OptionButtons
          options={photoShapes}
          value={style.photoShape ?? "circle"}
          onChange={(v) => onStyleChange({ ...style, photoShape: v })}
        />

        <SliderField
          label={t("style.photoSize", {
            n: style.photoSize ?? DEFAULT_PHOTO_SIZE,
          })}
          min={48}
          max={160}
          step={4}
          value={style.photoSize ?? DEFAULT_PHOTO_SIZE}
          onChange={(v) => onStyleChange({ ...style, photoSize: v })}
        />
      </div>
    </div>
  );
}

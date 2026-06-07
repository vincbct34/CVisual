"use client";

import { Label } from "@/components/ui/label";
import { TEMPLATES } from "@/components/templates";
import { defaultSidebarTypes } from "@/components/templates/template-utils";
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

const PHOTO_SHAPES: { value: PhotoShape; label: string }[] = [
  { value: "circle", label: "Rond" },
  { value: "rounded", label: "Arrondi" },
  { value: "square", label: "Carré" },
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

const COLOR_PRESETS: ColorPreset[] = [
  { primary: "#2563eb", label: "Bleu" },
  { primary: "#059669", label: "Vert" },
  { primary: "#dc2626", label: "Rouge" },
  { primary: "#7c3aed", label: "Violet" },
  { primary: "#ea580c", label: "Orange" },
  { primary: "#0891b2", label: "Cyan" },
  { primary: "#374151", label: "Gris" },
  { primary: "#000000", label: "Noir" },
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
        <Label className="text-sm font-medium">Template</Label>
        <OptionButtons
          options={Object.entries(TEMPLATES).map(([key, t]) => ({
            value: key,
            label: t.name,
          }))}
          value={template}
          onChange={onTemplateChange}
        />
      </div>

      {/* Sidebar layout (modern / creative) */}
      {hasSidebar && layoutSections.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Colonne latérale</Label>
          <p className="text-[11px] text-muted-foreground -mt-1">
            Choisissez les sections à placer dans la colonne latérale.
          </p>
          <div className="space-y-1.5">
            {layoutSections.map((s) => {
              const active = inSidebar(s);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSidebar(s.id)}
                  className="flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-colors"
                  style={{
                    background: active
                      ? "rgba(162,155,254,0.12)"
                      : "var(--card-bg)",
                    borderColor: active
                      ? "var(--accent-violet)"
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
                    {active ? "Latérale" : "Principale"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color presets */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Couleur</Label>
        <ColorPresetPicker
          style={style}
          presets={COLOR_PRESETS}
          onChange={onStyleChange}
        />
      </div>

      {/* Font */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Police</Label>
        <FontSelect style={style} fonts={FONTS} onChange={onStyleChange} />
      </div>

      {/* Font sizes — body / headings / meta */}
      <FontSizeControls style={style} onChange={onStyleChange} />

      {/* Profile photo */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Photo de profil</Label>

        <OptionButtons
          options={PHOTO_SHAPES}
          value={style.photoShape ?? "circle"}
          onChange={(v) => onStyleChange({ ...style, photoShape: v })}
        />

        <SliderField
          label={`Taille (${style.photoSize ?? DEFAULT_PHOTO_SIZE}px)`}
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

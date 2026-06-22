"use client";

import { Label } from "@/components/ui/label";
import { useT } from "@/components/i18n/language-provider";
import type {
  CoverLetterStyle,
  CoverLetterAccent,
  CoverLetterAlign,
} from "@/types/cover-letter";
import {
  ColorPresetPicker,
  FontSelect,
  FontSizeControls,
  OptionButtons,
  type ColorPreset,
} from "./style-controls";

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
  "Merriweather",
  "Playfair Display",
];

const COLOR_PRESET_DEFS: { primary: string; key: string }[] = [
  { primary: "#1a1a1a", key: "colors.noir" },
  { primary: "#2563eb", key: "colors.bleu" },
  { primary: "#059669", key: "colors.vert" },
  { primary: "#dc2626", key: "colors.rouge" },
  { primary: "#7c3aed", key: "colors.violet" },
  { primary: "#ea580c", key: "colors.orange" },
  { primary: "#0891b2", key: "colors.cyan" },
  { primary: "#374151", key: "colors.gris" },
];

const ACCENT_KEYS: { value: CoverLetterAccent; key: string }[] = [
  { value: "minimal", key: "style.accentMinimal" },
  { value: "line", key: "style.accentLine" },
  { value: "band", key: "style.accentBand" },
];

const ALIGN_KEYS: { value: CoverLetterAlign; key: string }[] = [
  { value: "left", key: "style.alignLeft" },
  { value: "justify", key: "style.alignJustify" },
];

interface CoverLetterStylePanelProps {
  style: CoverLetterStyle;
  onStyleChange: (style: CoverLetterStyle) => void;
}

export function CoverLetterStylePanel({
  style,
  onStyleChange,
}: CoverLetterStylePanelProps) {
  const t = useT();
  const accent = style.accent ?? "minimal";
  const textAlign = style.textAlign ?? "left";
  const lineHeight = style.lineHeight ?? 1.5;
  const accents = ACCENT_KEYS.map((a) => ({ value: a.value, label: t(a.key) }));
  const aligns = ALIGN_KEYS.map((a) => ({ value: a.value, label: t(a.key) }));
  const colorPresets: ColorPreset[] = COLOR_PRESET_DEFS.map((c) => ({
    primary: c.primary,
    label: t(c.key),
  }));

  return (
    <div className="space-y-5">
      {/* En-tête / accent */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("style.clHeader")}</Label>
        <p className="text-[11px] text-muted-foreground -mt-1">
          {t("style.clHeaderHelp")}
        </p>
        <OptionButtons
          options={accents}
          value={accent}
          onChange={(v) => onStyleChange({ ...style, accent: v })}
        />
      </div>

      {/* Couleur */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t("style.clAccentColor")}
        </Label>
        <ColorPresetPicker
          style={style}
          presets={colorPresets}
          onChange={onStyleChange}
        />
      </div>

      {/* Police */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("style.font")}</Label>
        <FontSelect style={style} fonts={FONTS} onChange={onStyleChange} />
      </div>

      {/* Tailles — texte / titres / dates */}
      <FontSizeControls style={style} onChange={onStyleChange} />

      {/* Interligne */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t("style.lineHeight", { n: lineHeight.toFixed(2) })}
        </Label>
        <input
          type="range"
          min={1.2}
          max={2}
          step={0.05}
          value={lineHeight}
          onChange={(e) =>
            onStyleChange({ ...style, lineHeight: Number(e.target.value) })
          }
          className="w-full cursor-pointer"
        />
      </div>

      {/* Alignement du corps */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("style.textAlign")}</Label>
        <OptionButtons
          columns={2}
          options={aligns}
          value={textAlign}
          onChange={(v) => onStyleChange({ ...style, textAlign: v })}
        />
      </div>
    </div>
  );
}

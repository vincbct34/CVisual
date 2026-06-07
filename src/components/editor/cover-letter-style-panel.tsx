"use client";

import { Label } from "@/components/ui/label";
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

const COLOR_PRESETS: ColorPreset[] = [
  { primary: "#1a1a1a", label: "Noir" },
  { primary: "#2563eb", label: "Bleu" },
  { primary: "#059669", label: "Vert" },
  { primary: "#dc2626", label: "Rouge" },
  { primary: "#7c3aed", label: "Violet" },
  { primary: "#ea580c", label: "Orange" },
  { primary: "#0891b2", label: "Cyan" },
  { primary: "#374151", label: "Gris" },
];

const ACCENTS: { value: CoverLetterAccent; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "line", label: "Trait" },
  { value: "band", label: "Bandeau" },
];

const ALIGNS: { value: CoverLetterAlign; label: string }[] = [
  { value: "left", label: "Gauche" },
  { value: "justify", label: "Justifié" },
];

interface CoverLetterStylePanelProps {
  style: CoverLetterStyle;
  onStyleChange: (style: CoverLetterStyle) => void;
}

export function CoverLetterStylePanel({
  style,
  onStyleChange,
}: CoverLetterStylePanelProps) {
  const accent = style.accent ?? "minimal";
  const textAlign = style.textAlign ?? "left";
  const lineHeight = style.lineHeight ?? 1.5;

  return (
    <div className="space-y-5">
      {/* En-tête / accent */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">En-tête</Label>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Style de l&apos;en-tête expéditeur.
        </p>
        <OptionButtons
          options={ACCENTS}
          value={accent}
          onChange={(v) => onStyleChange({ ...style, accent: v })}
        />
      </div>

      {/* Couleur */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Couleur d&apos;accent</Label>
        <ColorPresetPicker
          style={style}
          presets={COLOR_PRESETS}
          onChange={onStyleChange}
        />
      </div>

      {/* Police */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Police</Label>
        <FontSelect style={style} fonts={FONTS} onChange={onStyleChange} />
      </div>

      {/* Tailles — texte / titres / dates */}
      <FontSizeControls style={style} onChange={onStyleChange} />

      {/* Interligne */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Interligne ({lineHeight.toFixed(2)})
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
        <Label className="text-sm font-medium">Alignement du texte</Label>
        <OptionButtons
          columns={2}
          options={ALIGNS}
          value={textAlign}
          onChange={(v) => onStyleChange({ ...style, textAlign: v })}
        />
      </div>
    </div>
  );
}

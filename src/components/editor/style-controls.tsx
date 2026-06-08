"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Shared style controls used by both the resume StylePanel and the cover-letter
// StylePanel. Each is generic over the style object so it can mutate just the
// field it owns while leaving the rest of the (differently-shaped) style intact.

export interface ColorPreset {
  primary: string;
  label: string;
}

/** Color preset swatches + a native custom-color picker. */
export function ColorPresetPicker<T extends { primaryColor: string }>({
  style,
  presets,
  onChange,
}: {
  style: T;
  presets: ColorPreset[];
  onChange: (style: T) => void;
}) {
  const isCustom = !presets.some((p) => p.primary === style.primaryColor);
  return (
    <div className="grid grid-cols-4 gap-2">
      {presets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => onChange({ ...style, primaryColor: preset.primary })}
          className="flex flex-col items-center gap-1 cursor-pointer"
        >
          <div
            className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: preset.primary,
              borderColor:
                style.primaryColor === preset.primary
                  ? "var(--ink)"
                  : "transparent",
            }}
          />
          <span className="text-[10px] text-muted-foreground">
            {preset.label}
          </span>
        </button>
      ))}

      {/* Custom color swatch — opens the native picker */}
      <label className="flex flex-col items-center gap-1 cursor-pointer">
        <span
          className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            background: isCustom
              ? style.primaryColor
              : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
            borderColor: isCustom ? "var(--ink)" : "transparent",
          }}
        />
        <span className="text-[10px] text-muted-foreground">Perso</span>
        <input
          type="color"
          value={style.primaryColor}
          onChange={(e) => onChange({ ...style, primaryColor: e.target.value })}
          className="sr-only"
        />
      </label>
    </div>
  );
}

/** Font-family dropdown. */
export function FontSelect<T extends { fontFamily: string }>({
  style,
  fonts,
  onChange,
}: {
  style: T;
  fonts: string[];
  onChange: (style: T) => void;
}) {
  return (
    <Select
      value={style.fontFamily}
      onValueChange={(v) =>
        v != null && onChange({ ...style, fontFamily: String(v) })
      }
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {fonts.map((font) => (
          <SelectItem key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** The body / heading / meta size slider trio shared by both panels. */
export function FontSizeControls<
  T extends { fontSize: number; headingScale?: number; metaScale?: number },
>({ style, onChange }: { style: T; onChange: (style: T) => void }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Tailles</Label>

      <SliderField
        label={`Texte (${style.fontSize}px)`}
        min={10}
        max={18}
        value={style.fontSize}
        onChange={(v) => onChange({ ...style, fontSize: v })}
      />
      <SliderField
        label={`Titres (${Math.round((style.headingScale ?? 1) * 100)}%)`}
        min={0.7}
        max={1.5}
        step={0.05}
        value={style.headingScale ?? 1}
        onChange={(v) => onChange({ ...style, headingScale: v })}
      />
      <SliderField
        label={`Dates & coordonnées (${Math.round((style.metaScale ?? 1) * 100)}%)`}
        min={0.7}
        max={1.4}
        step={0.05}
        value={style.metaScale ?? 1}
        onChange={(v) => onChange({ ...style, metaScale: v })}
      />
    </div>
  );
}

/** A labelled range input (muted label variant). */
export function SliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
      />
    </div>
  );
}

/** A row of mutually-exclusive option buttons (template / shape / accent…). */
export function OptionButtons<V extends string>({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={
        columns === 2 ? "grid grid-cols-2 gap-2" : "grid grid-cols-3 gap-2"
      }
    >
      {options.map((o) => (
        <Button
          key={o.value}
          variant={value === o.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(o.value)}
          className="text-xs"
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/components/templates";
import { useT } from "@/components/i18n/language-provider";
import type { Resume, TemplateProps } from "@/types/resume";

// A4 at 96dpi (210mm × 297mm). Templates render at this width, then we scale
// the whole page down to whatever width the card ends up at — so two-column
// layouts keep their real proportions at any screen size.
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

function TemplateThumbnail({
  Component,
  resume,
}: {
  Component: ComponentType<TemplateProps>;
  resume: Resume;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth > 0) setScale(el.clientWidth / A4_WIDTH);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="w-full overflow-hidden bg-white"
      style={{ aspectRatio: "210 / 297" }}
    >
      <div
        style={{
          width: A4_WIDTH,
          height: A4_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
          // Hide until measured to avoid a full-size flash on open.
          visibility: scale > 0 ? "visible" : "hidden",
        }}
      >
        <Component resume={resume} />
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resume: Resume;
  currentTemplate: string;
  onSelect: (template: string) => void;
}

export function TemplatePreviewModal({
  open,
  onOpenChange,
  resume,
  currentTemplate,
  onSelect,
}: Props) {
  const t = useT();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("templateModal.title")}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
          {Object.entries(TEMPLATES).map(
            ([key, { component: TemplateComponent }]) => (
              <div
                key={key}
                className={`relative rounded overflow-hidden cursor-pointer transition-all border-2 ${
                  currentTemplate === key
                    ? "template-card-active"
                    : hovered === key
                      ? "template-card-hover"
                      : "template-card-default"
                }`}
                onClick={() => {
                  onSelect(key);
                  onOpenChange(false);
                }}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
              >
                <TemplateThumbnail
                  Component={TemplateComponent}
                  resume={resume}
                />
                <div className="template-card-footer p-2 flex items-center justify-between gap-2">
                  <span
                    className="text-xs font-semibold truncate min-w-0"
                    style={{ color: "var(--fg)" }}
                  >
                    {t(`templateNames.${key}`)}
                  </span>
                  {currentTemplate === key && (
                    <span
                      className="text-xs font-bold shrink-0"
                      style={{ color: "var(--accent-violet)" }}
                    >
                      {t("templateModal.current")}
                    </span>
                  )}
                </div>
              </div>
            ),
          )}
        </div>

        <div className="flex justify-end mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

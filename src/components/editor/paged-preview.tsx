"use client";

import { useEffect, useRef, useState } from "react";

// A4 at 96dpi.
const PAGE_W = 794; // 210mm
const PAGE_H = 1123; // 297mm
const GAP = 16; // visual gap between sheets (unscaled px)
const MAX_SCALE = 1; // never upscale past 100%

// Fine-grained break candidates: paragraphs, list items, headings, images,
// table rows. Breaking between these (rather than whole sections) keeps page
// fill tight while never slicing through a line of text.
const STOP_SELECTOR = "p, li, h1, h2, h3, h4, h5, img, tr";

/**
 * Renders its children as a stack of discrete A4 sheets (print pagination),
 * instead of one tall page.
 *
 * - A hidden measurer renders the content once at natural size to find page
 *   breaks at the furthest text-element boundary that fits each page, so lines
 *   are never cut in half and gaps stay minimal.
 * - Each sheet forces the template to the full multi-page height, so full-bleed
 *   decorations (e.g. a colored sidebar) paint all the way down every page,
 *   including a short final page.
 * - `transform: scale` keeps measurements in unscaled px; width auto-fits the
 *   container (responsive).
 */
interface PagedPreviewProps {
  children: React.ReactNode;
  /** Background painted on every sheet — matches the PDF page background so a
   *  sidebar column fills the whole page (default plain white). */
  pageBackground?: string;
  /** Top margin (mm) applied to pages after the first — matches the render
   *  target's `@page` rule so text isn't glued to the edge (default 0). */
  topMarginMm?: number;
}

// CSS millimetre in px (96dpi): 1mm = 96/25.4.
const MM_TO_PX = 96 / 25.4;

export function PagedPreview({
  children,
  pageBackground = "#ffffff",
  topMarginMm = 0,
}: PagedPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [offsets, setOffsets] = useState<number[]>([0]);

  const topMarginPx = topMarginMm * MM_TO_PX;

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const compute = () => {
      const w = container.clientWidth;
      if (w > 0) setScale(Math.min(w / PAGE_W, MAX_SCALE));

      const total = measure.scrollHeight;
      const top0 = measure.getBoundingClientRect().top;
      const stops: number[] = [];
      measure.querySelectorAll(STOP_SELECTOR).forEach((el) => {
        stops.push(el.getBoundingClientRect().bottom - top0);
      });
      stops.sort((a, b) => a - b);

      const offs = [0];
      let top = 0;
      let guard = 0;
      let pageIdx = 0;
      // Pages after the first lose `topMarginPx` of usable height (the @page
      // top margin), so they break earlier — mirrors the PDF.
      while (guard++ < 200) {
        const usable = pageIdx === 0 ? PAGE_H : PAGE_H - topMarginPx;
        if (top + usable >= total - 1) break;
        const limit = top + usable;
        const fit = stops.filter((s) => s > top + 1 && s <= limit);
        // Snap to the last element boundary that fits; if a single element is
        // taller than a page, fall back to a hard cut so we still progress.
        const next = fit.length ? fit[fit.length - 1] : limit;
        offs.push(next);
        top = next;
        pageIdx++;
      }
      setOffsets(offs);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    ro.observe(measure);
    return () => ro.disconnect();
  }, [topMarginPx]);

  const pages = offsets.length;
  const forcedHeight = pages * PAGE_H; // makes decorations fill every page
  const stackHeight = pages * PAGE_H + (pages - 1) * GAP;

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      {/* Hidden measurer — natural layout, drives the page-break math. */}
      <div
        ref={measureRef}
        aria-hidden
        style={{
          position: "absolute",
          left: -99999,
          top: 0,
          width: PAGE_W,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        {children}
      </div>

      <div
        style={{
          width: PAGE_W * scale,
          height: stackHeight * scale,
          position: "relative",
          visibility: scale > 0 ? "visible" : "hidden",
        }}
      >
        <div
          style={{
            width: PAGE_W,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {offsets.map((sliceTop, i) => {
            const sliceBottom = offsets[i + 1] ?? forcedHeight;
            const isLast = i === pages - 1;
            // Pages after the first are inset by the @page top margin (text
            // templates only; sidebar templates pass 0). The usable height
            // shrinks by the same amount.
            const marginTop = i === 0 ? 0 : topMarginPx;
            const usable = PAGE_H - marginTop;
            // Last page fills the usable area so the decoration reaches the
            // bottom; earlier pages clip at the break so the next line never
            // bleeds in.
            const clipH = isLast
              ? usable
              : Math.min(Math.ceil(sliceBottom - sliceTop), usable);
            return (
              <div
                key={i}
                className="shadow-lg relative overflow-hidden"
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  background: pageBackground,
                  marginBottom: i < pages - 1 ? GAP : 0,
                }}
              >
                <div
                  style={{
                    marginTop,
                    height: clipH,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -sliceTop,
                      left: 0,
                      width: PAGE_W,
                      height: forcedHeight,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {children}
                  </div>
                </div>
                <span
                  className="absolute bottom-2 right-2 text-[11px] font-medium px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    zIndex: 2,
                  }}
                >
                  {i + 1} / {pages}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

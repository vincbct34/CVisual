"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared resizable / collapsible editor layout (left editor + right preview).
 * Persists the divider width and collapsed state under `<storagePrefix>_*`
 * localStorage keys so the resume and cover-letter editors stay independent.
 */
export function useResizablePanels(storagePrefix: string) {
  const widthKey = `${storagePrefix}_left_width`;
  const collapsedKey = `${storagePrefix}_preview_collapsed`;

  const mainAreaRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(420);
  const leftWidthRef = useRef(420);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const draggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Restore persisted panel width / collapsed state
  useEffect(() => {
    const saved = Number(localStorage.getItem(widthKey));
    if (saved >= 320 && saved <= 1000) {
      leftWidthRef.current = saved;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLeftWidth(saved);
    }
    if (localStorage.getItem(collapsedKey) === "1") setPreviewCollapsed(true);
  }, [widthKey, collapsedKey]);

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      setIsDragging(true);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      const onMove = (ev: PointerEvent) => {
        if (!draggingRef.current || !mainAreaRef.current) return;
        const rect = mainAreaRef.current.getBoundingClientRect();
        const w = Math.min(
          Math.max(ev.clientX - rect.left, 320),
          rect.width - 360,
        );
        leftWidthRef.current = w;
        setLeftWidth(w);
      };
      const onUp = () => {
        draggingRef.current = false;
        setIsDragging(false);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        localStorage.setItem(
          widthKey,
          String(Math.round(leftWidthRef.current)),
        );
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [widthKey],
  );

  const togglePreview = useCallback(() => {
    setPreviewCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(collapsedKey, next ? "1" : "0");
      return next;
    });
  }, [collapsedKey]);

  return {
    mainAreaRef,
    leftWidth,
    previewCollapsed,
    isDragging,
    startResize,
    togglePreview,
  };
}

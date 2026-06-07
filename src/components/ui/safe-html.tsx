"use client";

import { useMemo } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
  );
}

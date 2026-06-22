"use client";

import { useT } from "@/components/i18n/language-provider";

/** Full-screen centered loading state, shared by dashboard + editor pages. */
export function PageLoading({ label }: { label?: string }) {
  const t = useT();
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      <p style={{ color: "var(--fg-muted)" }}>{label ?? t("common.loading")}</p>
    </div>
  );
}

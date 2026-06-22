"use client";

import { useLocalizedRouter } from "@/components/i18n/link";
import { useT, useLocale } from "@/components/i18n/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { AnimatedCard } from "@/components/ui/motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { downloadExport } from "@/lib/export-download";

interface CoverLetterCardProps {
  coverLetter: {
    id: string;
    title: string;
    language: string;
    updatedAt: string;
  };
  onDelete: (id: string) => void;
  onDuplicate?: () => void;
}

export function CoverLetterCard({
  coverLetter,
  onDelete,
  onDuplicate,
}: CoverLetterCardProps) {
  const router = useLocalizedRouter();
  const t = useT();
  const locale = useLocale();
  const { authFetch } = useAuth();

  async function handleDuplicate() {
    try {
      const getRes = await authFetch(`/api/cover-letters/${coverLetter.id}`);
      if (!getRes.ok) throw new Error();
      const { coverLetter: full } = await getRes.json();
      const res = await authFetch("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${full.title} (copie)`,
          language: full.language,
          content: full.content,
          style: full.style,
          resumeId: full.resumeId,
        }),
      });
      if (res.ok) {
        toast.success(t("coverLetterCard.duplicated"));
        onDuplicate?.();
      }
    } catch {
      toast.error(t("coverLetterCard.duplicateError"));
    }
  }

  async function handleExport(format: string) {
    try {
      await downloadExport(
        authFetch,
        `/api/cover-letters/${coverLetter.id}/export`,
        format,
        coverLetter.title,
        "lettre",
      );
      toast.success(
        t("coverLetterCard.exportSuccess", { format: format.toUpperCase() }),
      );
    } catch {
      toast.error(
        t("coverLetterCard.exportError", { format: format.toUpperCase() }),
      );
    }
  }

  async function handleDelete() {
    try {
      const res = await authFetch(`/api/cover-letters/${coverLetter.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(t("coverLetterCard.deleted"));
        onDelete(coverLetter.id);
      }
    } catch {
      toast.error(t("coverLetterCard.deleteError"));
    }
  }

  return (
    <AnimatedCard
      className="glass-card p-5 flex flex-col gap-3"
      style={{ cursor: "default" } as React.CSSProperties}
    >
      <div className="flex items-start justify-between">
        <h3
          className="text-base font-bold line-clamp-1 flex-1 mr-2"
          style={{
            color: "var(--fg)",
            fontFamily: "var(--serif)",
          }}
        >
          {coverLetter.title}
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="icon-btn"
            aria-label={t("coverLetterCard.actions")}
          >
            ···
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/cover-letter/${coverLetter.id}`)}
            >
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              {t("common.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              {t("coverLetterCard.exportPdf")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("docx")}>
              {t("coverLetterCard.exportDocx")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("html")}>
              {t("coverLetterCard.exportHtml")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
            >
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <span className="ed-tag ed-tag-accent">
          {coverLetter.language.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
          {t("coverLetterCard.modifiedOn", {
            date: new Date(coverLetter.updatedAt).toLocaleDateString(
              locale === "en" ? "en-US" : "fr-FR",
            ),
          })}
        </span>
        <button
          className="btn-gradient text-xs"
          style={{ padding: "0.5rem 1rem" }}
          onClick={() => router.push(`/cover-letter/${coverLetter.id}`)}
        >
          {t("coverLetterCard.editBtn")}
        </button>
      </div>
    </AnimatedCard>
  );
}

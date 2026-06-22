"use client";

import { useState } from "react";
import { useLocalizedRouter } from "@/components/i18n/link";
import { useT, useLocale } from "@/components/i18n/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { useAI } from "@/hooks/use-ai";
import { translateSections } from "@/lib/ai/translate";
import { AISettingsDialog } from "@/components/ai/ai-settings-dialog";
import { AnimatedCard } from "@/components/ui/motion";
import { TEMPLATES } from "@/components/templates";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
];

interface ResumeCardProps {
  resume: {
    id: string;
    title: string;
    language: string;
    template: string;
    updatedAt: string;
  };
  onDelete: (id: string) => void;
  onDuplicate?: () => void;
}

export function ResumeCard({ resume, onDelete, onDuplicate }: ResumeCardProps) {
  const router = useLocalizedRouter();
  const t = useT();
  const locale = useLocale();
  const { authFetch } = useAuth();
  const { apiKey, hasKey, provider } = useAI();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  async function handleDuplicate() {
    try {
      const res = await authFetch(`/api/cv/${resume.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        toast.success(t("resumeCard.duplicated"));
        onDuplicate?.();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || t("resumeCard.duplicateError"));
      }
    } catch {
      toast.error(t("resumeCard.duplicateError"));
    }
  }

  async function handleTranslate(language: string) {
    try {
      const res = await authFetch(`/api/cv/${resume.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || t("resumeCard.duplicateError"));
        return;
      }
      const { resume: newResume } = await res.json();

      if (hasKey && apiKey) {
        setIsTranslating(true);
        setTranslationProgress(t("resumeCard.translating"));
        try {
          const fullRes = await authFetch(`/api/cv/${newResume.id}`);
          if (!fullRes.ok) throw new Error("Failed to fetch resume");
          const { resume: fullResume } = await fullRes.json();
          const result = await translateSections(
            fullResume.sections,
            resume.language,
            language,
            apiKey,
            (current, total) =>
              setTranslationProgress(
                t("resumeCard.translatingProgress", { current, total }),
              ),
            provider,
            locale,
          );
          const writes = await Promise.all(
            result.sections.map((section) =>
              authFetch(`/api/cv/${newResume.id}/sections/${section.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: section.title,
                  content: section.content,
                }),
              })
                .then((res) => res.ok)
                .catch(() => false),
            ),
          );
          const writeFailures = writes.filter((ok) => !ok).length;
          const failures = result.failedSections.length + writeFailures;
          if (failures > 0) {
            toast.warning(
              t("resumeCard.translatePartial", { count: failures }),
            );
          } else {
            toast.success(
              t("resumeCard.translatedTo", { lang: language.toUpperCase() }),
            );
          }
        } catch {
          toast.error(t("resumeCard.translateAiError"));
        } finally {
          setIsTranslating(false);
          setTranslationProgress("");
        }
      } else {
        toast.success(
          t("resumeCard.duplicatedTo", { lang: language.toUpperCase() }),
        );
      }
      router.push(`/editor/${newResume.id}`);
    } catch {
      toast.error(t("resumeCard.translateError"));
    }
  }

  async function handleDelete() {
    try {
      const res = await authFetch(`/api/cv/${resume.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t("resumeCard.deleted"));
        onDelete(resume.id);
      }
    } catch {
      toast.error(t("resumeCard.deleteError"));
    }
  }

  return (
    <>
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
            {resume.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger className="icon-btn">···</DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/editor/${resume.id}`)}
              >
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                {t("common.duplicate")}
              </DropdownMenuItem>
              {!hasKey && (
                <DropdownMenuItem
                  disabled
                  className="text-xs"
                  style={{ color: "var(--fg-muted)", fontStyle: "italic" }}
                >
                  {t("resumeCard.translateLocked")}
                </DropdownMenuItem>
              )}
              {hasKey &&
                LANGUAGES.filter((l) => l.code !== resume.language).map(
                  (lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => handleTranslate(lang.code)}
                      disabled={isTranslating}
                    >
                      {t("resumeCard.translateTo", { lang: lang.label })}
                    </DropdownMenuItem>
                  ),
                )}
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="ed-tag ed-tag-accent">
            {TEMPLATES[resume.template]
              ? t(`templateNames.${resume.template}`)
              : resume.template}
          </span>
          <span className="ed-tag">{resume.language.toUpperCase()}</span>
        </div>

        {isTranslating && (
          <p
            className="text-xs animate-pulse"
            style={{ color: "var(--accent-violet)" }}
          >
            {translationProgress}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
            {t("resumeCard.modifiedOn", {
              date: new Date(resume.updatedAt).toLocaleDateString(
                locale === "en" ? "en-US" : "fr-FR",
              ),
            })}
          </span>
          <button
            className="btn-gradient text-xs"
            style={{ padding: "0.5rem 1rem" }}
            onClick={() => router.push(`/editor/${resume.id}`)}
          >
            {t("resumeCard.editBtn")}
          </button>
        </div>
      </AnimatedCard>

      <AISettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}

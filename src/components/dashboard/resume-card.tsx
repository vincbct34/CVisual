"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
        toast.success("CV dupliqué !");
        onDuplicate?.();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Erreur lors de la duplication");
      }
    } catch {
      toast.error("Erreur lors de la duplication");
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
        toast.error(data?.error || "Erreur lors de la duplication");
        return;
      }
      const { resume: newResume } = await res.json();

      if (hasKey && apiKey) {
        setIsTranslating(true);
        setTranslationProgress("Traduction en cours...");
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
              setTranslationProgress(`Traduction... (${current}/${total})`),
            provider,
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
              `CV traduit, mais ${failures} section(s) non enregistrées`,
            );
          } else {
            toast.success(`CV traduit vers ${language.toUpperCase()} !`);
          }
        } catch {
          toast.error(
            "Erreur lors de la traduction IA — le CV a été dupliqué sans traduction",
          );
        } finally {
          setIsTranslating(false);
          setTranslationProgress("");
        }
      } else {
        toast.success(
          `CV dupliqué vers ${language.toUpperCase()} — configurez l'IA pour traduire automatiquement`,
        );
      }
      router.push(`/editor/${newResume.id}`);
    } catch {
      toast.error("Erreur lors de la traduction");
    }
  }

  async function handleDelete() {
    try {
      const res = await authFetch(`/api/cv/${resume.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("CV supprimé");
        onDelete(resume.id);
      }
    } catch {
      toast.error("Erreur lors de la suppression");
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
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                Dupliquer
              </DropdownMenuItem>
              {!hasKey && (
                <DropdownMenuItem
                  disabled
                  className="text-xs"
                  style={{ color: "var(--fg-muted)", fontStyle: "italic" }}
                >
                  🔒 Traduction — clé IA requise
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
                      Traduire vers {lang.label}
                    </DropdownMenuItem>
                  ),
                )}
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="ed-tag ed-tag-accent">
            {TEMPLATES[resume.template]?.name ?? resume.template}
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
            Modifié le {new Date(resume.updatedAt).toLocaleDateString("fr-FR")}
          </span>
          <button
            className="btn-gradient text-xs"
            style={{ padding: "0.5rem 1rem" }}
            onClick={() => router.push(`/editor/${resume.id}`)}
          >
            Éditer
          </button>
        </div>
      </AnimatedCard>

      <AISettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}

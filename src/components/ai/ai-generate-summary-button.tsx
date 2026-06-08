"use client";

import { useState } from "react";
import { useAI } from "@/hooks/use-ai";
import { AISettingsDialog } from "./ai-settings-dialog";
import { SparklesIcon, notifyAINotConfigured } from "./ai-shared";
import { AIError } from "@/lib/ai/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { toast } from "sonner";
import type { Resume } from "@/types/resume";
import {
  getProfile,
  getExperiences,
  getSkills,
  getEducation,
} from "@/components/templates/template-utils";

interface AIGenerateSummaryButtonProps {
  resume: Resume;
  onAccept: (summary: string) => void;
}

export function AIGenerateSummaryButton({
  resume,
  onAccept,
}: AIGenerateSummaryButtonProps) {
  const { hasKey, generateSummary } = useAI();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  function buildResumeData() {
    const profile = getProfile(resume.sections);
    const experiences = getExperiences(resume.sections);
    const skills = getSkills(resume.sections);
    const education = getEducation(resume.sections);

    return {
      jobTitle: profile.jobTitle || "",
      experiences: experiences.length
        ? experiences.map((e) => `${e.position} chez ${e.company}`).join("\n")
        : "",
      skills: skills.length ? skills.map((s) => s.name).join(", ") : "",
      education: education.length
        ? education
            .map((e) => `${e.degree} ${e.field} — ${e.institution}`)
            .join("\n")
        : "",
      language: resume.language,
    };
  }

  function handleNoKey() {
    notifyAINotConfigured(() => setShowSettings(true), "générer un résumé");
  }

  async function handleGenerate() {
    if (!hasKey) {
      handleNoKey();
      return;
    }

    const data = buildResumeData();
    if (!data.experiences && !data.skills && !data.education) {
      toast.error(
        "Ajoutez des expériences, compétences ou formations pour un meilleur résultat",
      );
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const summary = await generateSummary(data);
      setResult(summary);
    } catch (err) {
      if (err instanceof AIError && err.code === "no_key") {
        setShowSettings(true);
      } else {
        toast.error(
          err instanceof AIError ? err.message : "Erreur lors de la génération",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {!result ? (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          title={
            hasKey
              ? "Génère un résumé à partir de vos expériences, compétences et formations (remplace le texte actuel). Pour retoucher le texte existant, utilisez « Améliorer »."
              : "Clé API IA non configurée"
          }
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 transition-all"
          style={{
            background: hasKey ? "var(--accent-soft)" : "var(--input-bg)",
            border: `1px solid ${hasKey ? "var(--accent)" : "var(--input-border)"}`,
            borderRadius: "var(--radius)",
            color: hasKey ? "var(--accent-strong)" : "var(--fg-muted)",
            opacity: hasKey ? (isLoading ? 0.6 : 1) : 0.45,
            cursor: hasKey ? "pointer" : "not-allowed",
          }}
        >
          <SparklesIcon size={11} dim={!hasKey} />
          {isLoading ? "Génération…" : "Générer avec l'IA"}
        </button>
      ) : (
        <div className="w-full basis-full border rounded-md p-3 bg-muted/30 space-y-2 overflow-x-auto">
          <p className="text-xs font-medium text-muted-foreground">
            Résumé généré :
          </p>
          <div
            className="text-sm prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(result) }}
          />
          <div className="flex gap-2">
            <button
              className="btn-gradient text-xs"
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius)",
              }}
              onClick={() => {
                onAccept(result);
                setResult(null);
                toast.success("Résumé appliqué !");
              }}
            >
              Accepter
            </button>
            <button
              className="btn-ghost text-xs"
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius)",
              }}
              onClick={() => setResult(null)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <AISettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}

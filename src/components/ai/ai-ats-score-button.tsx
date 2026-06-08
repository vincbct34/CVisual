"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAI } from "@/hooks/use-ai";
import { AISettingsDialog } from "./ai-settings-dialog";
import { SparklesIcon, notifyAINotConfigured } from "./ai-shared";
import { atsScorePrompt } from "@/lib/ai/prompts";
import { parseJsonResponse } from "@/lib/ai/json";
import { toast } from "sonner";
import type { Resume } from "@/types/resume";

interface ATSScoreResult {
  score: number;
  strengths: string[];
  improvements: string[];
  keywords_missing: string[];
}

interface Props {
  resume: Resume;
}

export function AIAtsScoreButton({ resume }: Props) {
  const { generate, isConfigured } = useAI();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ATSScoreResult | null>(null);
  const [jobDescription, setJobDescription] = useState("");

  const [showSettings, setShowSettings] = useState(false);

  function handleNoKey() {
    notifyAINotConfigured(() => setShowSettings(true), "scorer votre CV");
  }

  function handleOpen() {
    if (!isConfigured) {
      handleNoKey();
      return;
    }
    setOpen(true);
    setResult(null);
    setJobDescription("");
  }

  async function handleScore() {
    setLoading(true);
    setResult(null);
    try {
      const profile = resume.sections.find((s) => s.type === "profile")
        ?.content as Record<string, unknown> | undefined;
      const jobTitle = (profile?.jobTitle as string) ?? "";

      const sectionText = resume.sections
        .filter((s) => s.visible)
        .map((s) => {
          const c = s.content as Record<string, unknown>;
          const items = (c?.items as Record<string, unknown>[]) ?? [];
          if (items.length > 0) {
            return `${s.title}:\n${items.map((i) => Object.values(i).filter(Boolean).join(" | ")).join("\n")}`;
          }
          return `${s.title}:\n${Object.values(c).filter(Boolean).join(" ")}`;
        })
        .join("\n\n");

      const messages = atsScorePrompt({
        jobTitle,
        sections: sectionText,
        language: resume.language,
        jobDescription: jobDescription.trim() || undefined,
      });
      const raw = await generate(messages);
      const parsed = parseJsonResponse<ATSScoreResult>(raw);
      setResult(parsed);
    } catch {
      toast.error("Erreur lors de l'analyse ATS");
    } finally {
      setLoading(false);
    }
  }

  const scoreClass = !result
    ? ""
    : result.score >= 75
      ? "ats-score-great"
      : result.score >= 50
        ? "ats-score-ok"
        : "ats-score-poor";

  return (
    <>
      <button
        onClick={handleOpen}
        title={
          isConfigured
            ? "Analyser la compatibilité ATS"
            : "Clé API IA non configurée"
        }
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 transition-all"
        style={{
          background: isConfigured ? "var(--accent-soft)" : "var(--input-bg)",
          border: `1px solid ${isConfigured ? "var(--accent)" : "var(--card-border)"}`,
          borderRadius: "var(--radius)",
          color: isConfigured ? "var(--accent-strong)" : "var(--fg-muted)",
          opacity: isConfigured ? 1 : 0.45,
          cursor: isConfigured ? "pointer" : "not-allowed",
        }}
      >
        <SparklesIcon size={11} />
        Score ATS
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg lg:max-w-xl">
          <DialogHeader>
            <DialogTitle>Analyse ATS</DialogTitle>
          </DialogHeader>

          {!result && !loading && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="jobDescription">
                  Description de l&apos;offre (Optionnel)
                </Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Collez ici la description du poste ciblé pour une analyse plus précise..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="h-32"
                />
              </div>
              <Button onClick={handleScore} className="w-full">
                Lancer l&apos;analyse
              </Button>
            </div>
          )}

          {loading && (
            <p
              className="text-sm py-8 text-center"
              style={{ color: "var(--fg-muted)" }}
            >
              Analyse en cours...
            </p>
          )}

          {result && !loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`text-2xl font-bold rounded-full w-16 h-16 flex items-center justify-center ${scoreClass}`}
                >
                  {result.score}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--fg)" }}>
                    Score ATS
                  </p>
                  <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                    {result.score >= 75
                      ? "Excellent"
                      : result.score >= 50
                        ? "Correct"
                        : "À améliorer"}
                  </p>
                </div>
              </div>

              {result.strengths.length > 0 && (
                <div>
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: "var(--success)" }}
                  >
                    Points forts
                  </p>
                  <ul
                    className="text-sm space-y-1"
                    style={{ color: "var(--fg)" }}
                  >
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span>✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.improvements.length > 0 && (
                <div>
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: "var(--warning)" }}
                  >
                    Améliorations
                  </p>
                  <ul
                    className="text-sm space-y-1"
                    style={{ color: "var(--fg)" }}
                  >
                    {result.improvements.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span>→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.keywords_missing.length > 0 && (
                <div>
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    Mots-clés manquants
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.keywords_missing.map((k, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-lg"
                        style={{
                          background: "var(--input-bg)",
                          color: "var(--fg)",
                          border: "1px solid var(--input-border)",
                        }}
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setResult(null)}
              >
                Nouvelle analyse
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AISettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}

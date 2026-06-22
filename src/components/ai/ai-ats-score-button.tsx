"use client";

import { useState, useCallback } from "react";
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
import { useT, useLocale } from "@/components/i18n/language-provider";
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

interface ATSHistoryEntry {
  id: string;
  date: number;
  jobDescription?: string;
  result: ATSScoreResult;
}

const HISTORY_LIMIT = 10;
const historyKey = (resumeId: string) => `cvisual_ats_history_${resumeId}`;

function loadHistory(resumeId: string): ATSHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(historyKey(resumeId));
    return raw ? (JSON.parse(raw) as ATSHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(resumeId: string, entries: ATSHistoryEntry[]) {
  try {
    window.localStorage.setItem(
      historyKey(resumeId),
      JSON.stringify(entries.slice(0, HISTORY_LIMIT)),
    );
  } catch {
    // ignore quota / serialization errors
  }
}

interface Props {
  resume: Resume;
}

export function AIAtsScoreButton({ resume }: Props) {
  const { generate, isConfigured } = useAI();
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ATSScoreResult | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [history, setHistory] = useState<ATSHistoryEntry[]>([]);

  const [showSettings, setShowSettings] = useState(false);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory(resume.id, []);
  }, [resume.id]);

  function handleNoKey() {
    notifyAINotConfigured(() => setShowSettings(true), t("ai.actionScore"), t);
  }

  function handleOpen() {
    if (!isConfigured) {
      handleNoKey();
      return;
    }
    setHistory(loadHistory(resume.id));
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

      const entry: ATSHistoryEntry = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),
        date: Date.now(),
        jobDescription: jobDescription.trim() || undefined,
        result: parsed,
      };
      const next = [entry, ...history].slice(0, HISTORY_LIMIT);
      setHistory(next);
      saveHistory(resume.id, next);
    } catch {
      toast.error(t("ai.atsError"));
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
        title={isConfigured ? t("ai.atsTooltip") : t("ai.notConfiguredShort")}
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
        {t("ai.scoreAts")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg lg:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("ai.atsTitle")}</DialogTitle>
          </DialogHeader>

          {!result && !loading && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="jobDescription">
                  {t("ai.jobDescOptional")}
                </Label>
                <Textarea
                  id="jobDescription"
                  placeholder={t("ai.jobDescPlaceholderAts")}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="h-32"
                />
              </div>
              <Button onClick={handleScore} className="w-full">
                {t("ai.runAnalysis")}
              </Button>

              {history.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--fg)" }}
                    >
                      {t("ai.history")}
                    </p>
                    <button
                      onClick={clearHistory}
                      className="text-xs underline"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {t("ai.clear")}
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {history.map((h) => (
                      <li key={h.id}>
                        <button
                          onClick={() => setResult(h.result)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all"
                          style={{
                            background: "var(--input-bg)",
                            border: "1px solid var(--input-border)",
                            borderRadius: "var(--radius)",
                          }}
                        >
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{
                              color:
                                h.result.score >= 75
                                  ? "var(--success)"
                                  : h.result.score >= 50
                                    ? "var(--warning)"
                                    : "var(--destructive)",
                            }}
                          >
                            {h.result.score}
                          </span>
                          <span
                            className="text-xs flex-1 min-w-0 truncate"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            {h.jobDescription
                              ? h.jobDescription
                              : t("ai.noJobDesc")}
                          </span>
                          <span
                            className="text-xs whitespace-nowrap"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            {new Date(h.date).toLocaleDateString(
                              locale === "en" ? "en-US" : "fr-FR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {loading && (
            <p
              className="text-sm py-8 text-center"
              style={{ color: "var(--fg-muted)" }}
            >
              {t("ai.analyzing")}
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
                    {t("ai.scoreAts")}
                  </p>
                  <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                    {result.score >= 75
                      ? t("ai.excellent")
                      : result.score >= 50
                        ? t("ai.correct")
                        : t("ai.toImprove")}
                  </p>
                </div>
              </div>

              {result.strengths.length > 0 && (
                <div>
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: "var(--success)" }}
                  >
                    {t("ai.strengths")}
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
                    {t("ai.improvements")}
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
                    {t("ai.keywordsMissing")}
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
                {t("ai.newAnalysis")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AISettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}

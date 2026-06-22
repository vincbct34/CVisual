"use client";

import { useState, useRef } from "react";
import { useAI } from "@/hooks/use-ai";
import { useT } from "@/components/i18n/language-provider";
import { AISettingsDialog } from "./ai-settings-dialog";
import { SparklesIcon, notifyAINotConfigured } from "./ai-shared";
import { AIError } from "@/lib/ai/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { toast } from "sonner";

interface AIImproveButtonProps {
  content: string;
  context?: string;
  onAccept: (improved: string) => void;
}

export function AIImproveButton({
  content,
  context,
  onAccept,
}: AIImproveButtonProps) {
  const { hasKey, improve } = useAI();
  const t = useT();
  const PRESETS: { label: string; instruction: string }[] = [
    { label: t("ai.presetFix"), instruction: t("ai.presetFixInstr") },
    { label: t("ai.presetShorten"), instruction: t("ai.presetShortenInstr") },
    {
      label: t("ai.presetProfessional"),
      instruction: t("ai.presetProfessionalInstr"),
    },
    { label: t("ai.presetPunchy"), instruction: t("ai.presetPunchyInstr") },
    { label: t("ai.presetExpand"), instruction: t("ai.presetExpandInstr") },
  ];
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const requestId = useRef(0);

  function handleNoKey() {
    notifyAINotConfigured(
      () => setShowSettings(true),
      t("ai.actionImprove"),
      t,
    );
  }

  function openPanel() {
    if (!hasKey) {
      handleNoKey();
      return;
    }
    if (!content.trim() || content === "<p></p>") {
      toast.error(t("ai.addContentFirst"));
      return;
    }
    setResult(null);
    setInstruction("");
    setIsOpen(true);
  }

  function closePanel() {
    setIsOpen(false);
    setResult(null);
    setInstruction("");
  }

  async function runImprove(customInstruction?: string) {
    if (isLoading) return;
    const currentId = ++requestId.current;
    setIsLoading(true);
    setResult(null);
    try {
      const improved = await improve(content, context, customInstruction);
      if (currentId === requestId.current) setResult(improved);
    } catch (err) {
      if (currentId !== requestId.current) return;
      if (err instanceof AIError && err.code === "no_key") {
        handleNoKey();
      } else {
        toast.error(
          err instanceof AIError ? err.message : t("ai.improveError"),
        );
      }
    } finally {
      if (currentId === requestId.current) setIsLoading(false);
    }
  }

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          onClick={openPanel}
          title={hasKey ? t("ai.improveTitle") : t("ai.notConfiguredShort")}
          className="rte-toolbar-btn ml-auto flex items-center gap-1"
          style={{
            color: hasKey ? "var(--accent-violet)" : "var(--fg-muted)",
            opacity: hasKey ? 1 : 0.45,
            cursor: hasKey ? "pointer" : "not-allowed",
          }}
        >
          <SparklesIcon />
          IA
        </button>
      ) : (
        <div
          className="w-full basis-full border rounded-md p-3 mt-2 space-y-3"
          style={{
            background: "var(--input-bg)",
            borderColor: "var(--input-border)",
          }}
        >
          {result ? (
            <>
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--fg-muted)" }}
              >
                {t("ai.suggestion")}
              </p>
              <div
                className="text-sm prose prose-sm max-w-none overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(result) }}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-gradient text-xs"
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "var(--radius)",
                  }}
                  onClick={() => {
                    onAccept(result);
                    closePanel();
                    toast.success(t("ai.contentImproved"));
                  }}
                >
                  {t("ai.accept")}
                </button>
                <button
                  className="btn-ghost text-xs"
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "var(--radius)",
                  }}
                  onClick={() => setResult(null)}
                  disabled={isLoading}
                >
                  {t("ai.retry")}
                </button>
                <button
                  className="btn-ghost text-xs"
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "var(--radius)",
                  }}
                  onClick={closePanel}
                >
                  {t("common.close")}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p
                  className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: "var(--accent-violet)" }}
                >
                  <SparklesIcon />
                  {t("ai.improveTitle")}
                </p>
                <button
                  type="button"
                  className="text-xs"
                  style={{ color: "var(--fg-muted)" }}
                  onClick={closePanel}
                  disabled={isLoading}
                >
                  ✕
                </button>
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    disabled={isLoading}
                    onClick={() => runImprove(p.instruction)}
                    className="text-xs px-2 py-1 rounded-md transition-colors"
                    style={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--input-border)",
                      color: "var(--fg)",
                      opacity: isLoading ? 0.5 : 1,
                      cursor: isLoading ? "default" : "pointer",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom instruction */}
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                disabled={isLoading}
                rows={2}
                placeholder={t("ai.customPlaceholder")}
                className="w-full text-sm rounded-md px-2 py-1.5 resize-y"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--input-border)",
                  color: "var(--fg)",
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    runImprove(instruction);
                  }
                }}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-gradient text-xs"
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "var(--radius)",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                  disabled={isLoading}
                  onClick={() => runImprove(instruction)}
                >
                  {isLoading ? t("ai.improving") : t("ai.improve")}
                </button>
                {!isLoading && (
                  <button
                    className="btn-ghost text-xs"
                    style={{
                      padding: "0.3rem 0.75rem",
                      borderRadius: "var(--radius)",
                    }}
                    onClick={closePanel}
                  >
                    {t("common.cancel")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <AISettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}

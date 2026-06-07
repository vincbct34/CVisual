"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LinkedInParseResult } from "@/lib/linkedin-parser";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "reading" | "done";

export function AILinkedInImportDialog({ open, onOpenChange }: Props) {
  const { authFetch } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  function reset() {
    setStep("upload");
    setFileName("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function processFile(file: File) {
    setError("");
    setFileName(file.name);
    setStep("reading");

    // 1. Extraction + parsing côté serveur (pas d'IA)
    const form = new FormData();
    form.append("file", file);

    let parsed: LinkedInParseResult;
    try {
      const res = await authFetch("/api/cv/parse-linkedin-pdf", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la lecture du PDF");
        setStep("upload");
        return;
      }
      parsed = data.parsed as LinkedInParseResult;
    } catch {
      setError("Impossible de lire le PDF. Réessayez.");
      setStep("upload");
      return;
    }

    // 2. Construction des sections
    const sections: Record<string, unknown>[] = [];
    let order = 0;

    sections.push({
      type: "profile",
      title: "Profil",
      content: parsed.profile,
      order: order++,
    });
    if (parsed.experience.length > 0) {
      sections.push({
        type: "experience",
        title: "Expérience",
        content: { items: parsed.experience },
        order: order++,
      });
    }
    if (parsed.education.length > 0) {
      sections.push({
        type: "education",
        title: "Formation",
        content: { items: parsed.education },
        order: order++,
      });
    }
    if (parsed.skills.length > 0) {
      sections.push({
        type: "skills",
        title: "Compétences",
        content: { items: parsed.skills },
        order: order++,
      });
    }
    if (parsed.languages.length > 0) {
      sections.push({
        type: "languages",
        title: "Langues",
        content: { items: parsed.languages },
        order: order++,
      });
    }

    const title = parsed.profile.fullName
      ? `CV de ${parsed.profile.fullName}`
      : "CV LinkedIn";

    // 3. Création du CV
    try {
      const res = await authFetch("/api/cv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sections, language: "fr" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la création du CV");
        setStep("upload");
        return;
      }
      setStep("done");
      toast.success("Profil LinkedIn importé !");
      onOpenChange(false);
      router.push(`/editor/${data.resume.id}`);
    } catch {
      setError("Erreur lors de la création du CV");
      setStep("upload");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  const isLoading = step === "reading";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importer depuis LinkedIn</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Instructions */}
          <div
            className="rounded-xl p-3 space-y-2"
            style={{
              background: "rgba(116,185,255,0.07)",
              border: "1px solid rgba(116,185,255,0.2)",
            }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--accent-blue)" }}
            >
              Comment exporter votre PDF LinkedIn
            </p>
            <ol
              className="text-xs space-y-1 list-decimal list-inside"
              style={{ color: "var(--fg-muted)" }}
            >
              <li>Allez sur votre profil LinkedIn</li>
              <li>
                Cliquez sur{" "}
                <strong style={{ color: "var(--fg)" }}>
                  «&nbsp;Plus&nbsp;»
                </strong>{" "}
                →{" "}
                <strong style={{ color: "var(--fg)" }}>
                  «&nbsp;Enregistrer en PDF&nbsp;»
                </strong>
              </li>
              <li>Déposez le PDF téléchargé ci-dessous</li>
            </ol>
            <p
              className="text-xs"
              style={{
                color: "var(--fg-muted)",
                borderTop: "1px solid rgba(116,185,255,0.15)",
                paddingTop: "6px",
                marginTop: "4px",
              }}
            >
              Aucune clé IA requise — l&apos;extraction est entièrement
              automatique.
            </p>
          </div>

          {/* Zone de dépôt */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!isLoading) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={isLoading ? undefined : handleDrop}
            onClick={() => !isLoading && fileRef.current?.click()}
            className="rounded-xl p-8 text-center transition-all"
            style={{
              border: `2px dashed ${isDragging ? "var(--accent-blue)" : error ? "var(--destructive)" : "var(--input-border)"}`,
              background: isDragging
                ? "rgba(116,185,255,0.06)"
                : "var(--input-bg)",
              cursor: isLoading ? "default" : "pointer",
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <svg
                  className="animate-spin w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: "var(--accent-blue)" }}
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--fg)" }}
                  >
                    Lecture du profil…
                  </p>
                  {fileName && (
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {fileName}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mx-auto mb-3"
                  style={{ color: "var(--fg-muted)" }}
                >
                  <path
                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="14 2 14 8 20 8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" />
                  <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" />
                </svg>
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--fg)" }}
                >
                  Déposez votre PDF LinkedIn ici
                </p>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  ou cliquez pour choisir un fichier
                </p>
              </>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div
              className="rounded-xl p-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "var(--destructive)",
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <MagneticButton strength={0.2} padding={8}>
              <button
                className="btn-ghost"
                style={{ padding: "0.5rem 1.1rem", fontSize: "0.875rem" }}
                onClick={() => handleClose(false)}
                disabled={isLoading}
              >
                Annuler
              </button>
            </MagneticButton>
            <MagneticButton strength={0.2} padding={8}>
              <button
                className="btn-gradient"
                style={{
                  padding: "0.5rem 1.1rem",
                  fontSize: "0.875rem",
                  opacity: isLoading ? 0.6 : 1,
                }}
                onClick={() => fileRef.current?.click()}
                disabled={isLoading}
              >
                Choisir un PDF
              </button>
            </MagneticButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

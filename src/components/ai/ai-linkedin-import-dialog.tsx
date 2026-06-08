"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileDropzone } from "@/components/ui/file-dropzone";
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

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  function reset() {
    setStep("upload");
    setFileName("");
    setError("");
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
            className="p-3 space-y-2"
            style={{
              background: "var(--paper-2)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
            }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--accent-strong)" }}
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
                borderTop: "1px solid var(--line)",
                paddingTop: "6px",
                marginTop: "4px",
              }}
            >
              Aucune clé IA requise — l&apos;extraction est entièrement
              automatique.
            </p>
          </div>

          {/* Zone de dépôt */}
          <FileDropzone
            accept="application/pdf,.pdf"
            onFile={processFile}
            loading={isLoading}
            error={!!error}
            loadingTitle="Lecture du profil…"
            loadingSubtext={fileName}
            idleTitle="Déposez votre PDF LinkedIn ici"
          />

          {/* Erreur */}
          {error && (
            <div
              className="p-3 text-sm"
              style={{
                background: "var(--destructive-soft)",
                border: "1px solid var(--destructive)",
                borderRadius: "var(--radius)",
                color: "var(--destructive)",
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              className="btn-ghost"
              style={{ padding: "0.5rem 1.1rem", fontSize: "0.875rem" }}
              onClick={() => handleClose(false)}
              disabled={isLoading}
            >
              Fermer
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

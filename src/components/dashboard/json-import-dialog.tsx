"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocalizedRouter } from "@/components/i18n/link";
import { useT } from "@/components/i18n/language-provider";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileDropzone } from "@/components/ui/file-dropzone";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SCHEMA_EXAMPLE = `{
  "title": "Mon CV",
  "language": "fr",
  "template": "classic",
  "sections": [
    {
      "type": "profile",
      "title": "Profil",
      "content": {
        "fullName": "Jean Dupont",
        "jobTitle": "Développeur",
        "email": "jean@exemple.com",
        "phone": "06 00 00 00 00",
        "location": "Paris",
        "summary": "<p>Résumé...</p>"
      }
    },
    {
      "type": "experience",
      "title": "Expériences",
      "content": {
        "items": [{
          "id": "1",
          "company": "Entreprise",
          "position": "Poste",
          "startDate": "2022-01",
          "endDate": "",
          "current": true,
          "description": "<p>Description...</p>"
        }]
      }
    }
  ]
}`;

const SECTION_TYPES = [
  {
    type: "profile",
    fields: "fullName, jobTitle, email, phone, location, website, summary",
  },
  {
    type: "experience",
    fields:
      "items[ id, company, position, startDate, endDate, current, description ]",
  },
  {
    type: "education",
    fields:
      "items[ id, institution, degree, field, startDate, endDate, description ]",
  },
  { type: "skills", fields: "items[ id, name, level (1–5) ]" },
  {
    type: "languages",
    fields: "items[ id, name, level (Natif|Courant|Intermédiaire|Débutant) ]",
  },
  {
    type: "projects",
    fields: "items[ id, name, description, url, technologies ]",
  },
  { type: "certifications", fields: "items[ id, name, issuer, date ]" },
  { type: "interests", fields: "items[ id, name ]" },
  { type: "custom", fields: "text (HTML)" },
];

export function JsonImportDialog({ open, onOpenChange }: Props) {
  const { authFetch } = useAuth();
  const router = useLocalizedRouter();
  const t = useT();
  const [isImporting, setIsImporting] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  async function processFile(file: File) {
    if (!file.name.endsWith(".json")) {
      toast.error(t("jsonImport.mustBeJson"));
      return;
    }
    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await authFetch("/api/cv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? t("jsonImport.importError"));
        return;
      }
      toast.success(t("jsonImport.imported"));
      onOpenChange(false);
      router.push(`/editor/${result.resume.id}`);
    } catch {
      toast.error(t("jsonImport.invalidJson"));
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("jsonImport.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Zone drag & drop */}
          <FileDropzone
            accept=".json"
            onFile={processFile}
            loading={isImporting}
            loadingTitle={t("jsonImport.loadingTitle")}
            idleTitle={t("jsonImport.idleTitle")}
          />

          {/* Info sur la source */}
          <div
            className="rounded p-3 text-sm"
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--accent)",
            }}
          >
            <p
              className="font-semibold mb-0.5"
              style={{ color: "var(--accent-strong)" }}
            >
              {t("jsonImport.expectedFormat")}
            </p>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.8125rem" }}>
              {t("jsonImport.expectedFormatDesc")}
            </p>
          </div>

          {/* Schéma dépliable */}
          <div>
            <button
              className="flex items-center gap-1.5 text-xs font-semibold mb-2 transition-opacity hover:opacity-70"
              style={{
                color: "var(--fg-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              onClick={() => setShowSchema((v) => !v)}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
                style={{
                  transform: showSchema ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.15s",
                }}
              >
                <path
                  d="M4 2l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              {t("jsonImport.seeStructure")}
            </button>

            {showSchema && (
              <div className="space-y-3">
                {/* Exemple JSON */}
                <pre
                  className="rounded p-3 text-xs overflow-auto"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--fg)",
                    fontFamily: "var(--mono)",
                    maxHeight: "200px",
                    whiteSpace: "pre",
                  }}
                >
                  {SCHEMA_EXAMPLE}
                </pre>

                {/* Tableau des types de sections */}
                <div
                  className="rounded overflow-hidden"
                  style={{ border: "1px solid var(--input-border)" }}
                >
                  <div
                    className="px-3 py-2"
                    style={{
                      background: "var(--input-bg)",
                      borderBottom: "1px solid var(--input-border)",
                    }}
                  >
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "var(--fg)" }}
                    >
                      {t("jsonImport.availableTypes")}
                    </p>
                  </div>
                  <div style={{ maxHeight: "180px", overflowY: "auto" }}>
                    {SECTION_TYPES.map((s) => (
                      <div
                        key={s.type}
                        className="flex gap-3 px-3 py-1.5"
                        style={{
                          borderBottom: "1px solid var(--input-border)",
                        }}
                      >
                        <code
                          className="text-xs font-bold shrink-0 w-28"
                          style={{ color: "var(--accent-violet)" }}
                        >
                          {s.type}
                        </code>
                        <span
                          className="text-xs"
                          style={{ color: "var(--fg-muted)" }}
                        >
                          {s.fields}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              className="btn-ghost"
              style={{ padding: "0.5rem 1.1rem", fontSize: "0.875rem" }}
              onClick={() => onOpenChange(false)}
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

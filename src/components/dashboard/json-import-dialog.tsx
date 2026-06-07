"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MagneticButton } from "@/components/ui/magnetic-button";

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
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  async function processFile(file: File) {
    if (!file.name.endsWith(".json")) {
      toast.error("Le fichier doit être un .json");
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
        toast.error(result.error ?? "Erreur lors de l'import");
        return;
      }
      toast.success("CV importé !");
      onOpenChange(false);
      router.push(`/editor/${result.resume.id}`);
    } catch {
      toast.error("Fichier JSON invalide ou mal formaté");
    } finally {
      setIsImporting(false);
      if (fileRef.current) fileRef.current.value = "";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer un CV (JSON)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Zone drag & drop */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-xl p-8 text-center transition-all"
            style={{
              border: `2px dashed ${isDragging ? "var(--accent-violet)" : "var(--input-border)"}`,
              background: isDragging
                ? "rgba(162,155,254,0.06)"
                : "var(--input-bg)",
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
            {isImporting ? (
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="animate-spin w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: "var(--accent-violet)" }}
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
                <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                  Import en cours…
                </p>
              </div>
            ) : (
              <>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mx-auto mb-3"
                  style={{ color: "var(--fg-muted)" }}
                >
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--fg)" }}
                >
                  Déposez votre fichier .json ici
                </p>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  ou cliquez pour choisir un fichier
                </p>
              </>
            )}
          </div>

          {/* Info sur la source */}
          <div
            className="rounded-xl p-3 text-sm"
            style={{
              background: "rgba(162,155,254,0.07)",
              border: "1px solid rgba(162,155,254,0.18)",
            }}
          >
            <p
              className="font-semibold mb-0.5"
              style={{ color: "var(--accent-violet)" }}
            >
              Format attendu
            </p>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.8125rem" }}>
              Uniquement des exports CVisual (éditeur → Exporter → JSON). Un
              JSON aléatoire sera rejeté s&apos;il ne respecte pas la structure.
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
              Voir la structure complète
            </button>

            {showSchema && (
              <div className="space-y-3">
                {/* Exemple JSON */}
                <pre
                  className="rounded-xl p-3 text-xs overflow-auto"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--fg)",
                    fontFamily: "var(--font-geist-mono), monospace",
                    maxHeight: "200px",
                    whiteSpace: "pre",
                  }}
                >
                  {SCHEMA_EXAMPLE}
                </pre>

                {/* Tableau des types de sections */}
                <div
                  className="rounded-xl overflow-hidden"
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
                      Types de sections disponibles
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
            <MagneticButton strength={0.2} padding={8}>
              <button
                className="btn-ghost"
                style={{ padding: "0.5rem 1.1rem", fontSize: "0.875rem" }}
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </button>
            </MagneticButton>
            <MagneticButton strength={0.2} padding={8}>
              <button
                className="btn-gradient"
                style={{ padding: "0.5rem 1.1rem", fontSize: "0.875rem" }}
                onClick={() => fileRef.current?.click()}
                disabled={isImporting}
              >
                Choisir un fichier
              </button>
            </MagneticButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

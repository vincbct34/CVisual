"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useAI } from "@/hooks/use-ai";
import { AISettingsDialog } from "./ai-settings-dialog";
import { AIError } from "@/lib/ai/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  getProfile,
  getExperiences,
  getSkills,
} from "@/components/templates/template-utils";
import type { Resume } from "@/types/resume";

interface AIGenerateCoverLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIGenerateCoverLetterDialog({
  open,
  onOpenChange,
}: AIGenerateCoverLetterDialogProps) {
  const { authFetch } = useAuth();
  const { hasKey, generateCoverLetter } = useAI();
  const router = useRouter();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch resumes on open
  useEffect(() => {
    if (open) {
      authFetch("/api/cv").then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setResumes(data.resumes);
          if (data.resumes.length > 0 && !selectedResumeId) {
            setSelectedResumeId(data.resumes[0].id);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleGenerate() {
    if (!hasKey) {
      setShowSettings(true);
      return;
    }

    if (!selectedResumeId) {
      toast.error("Sélectionnez un CV");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Entrez la description du poste");
      return;
    }

    setIsLoading(true);
    setPreview(null);

    try {
      // Fetch the full resume
      const res = await authFetch(`/api/cv/${selectedResumeId}`);
      if (!res.ok) throw new Error("CV non trouvé");
      const { resume } = await res.json();

      const profile = getProfile(resume.sections);
      const experiences = getExperiences(resume.sections);
      const skills = getSkills(resume.sections);

      const result = await generateCoverLetter(
        {
          fullName: profile.fullName,
          jobTitle: profile.jobTitle,
          experiences: experiences
            .map((e) => `${e.position} chez ${e.company}: ${e.description}`)
            .join("\n"),
          skills: skills.map((s) => s.name).join(", "),
          language: resume.language,
          targetJobTitle: jobTitle,
          targetCompany: companyName,
          jobDescription,
          recipientName: recipientName || undefined,
        },
        (text) => setPreview(text),
      );

      setPreview(result);
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

  async function handleCreate() {
    if (!preview) return;

    try {
      const res = await authFetch("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Lettre — ${jobTitle || companyName || "Nouvelle"}`,
          resumeId: selectedResumeId,
          content: {
            recipientName,
            companyName,
            jobTitle,
            body: preview,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Lettre créée !");
        onOpenChange(false);
        router.push(`/cover-letter/${data.coverLetter.id}`);
      }
    } catch {
      toast.error("Erreur lors de la création");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Générer une lettre de motivation</DialogTitle>
            <DialogDescription>
              {
                "Sélectionnez un CV et décrivez le poste visé. L'IA générera une lettre personnalisée."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Resume selection */}
            <div className="space-y-1">
              <Label className="text-sm">CV source</Label>
              <Select
                value={selectedResumeId}
                onValueChange={(v) => v && setSelectedResumeId(String(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un CV...">
                    {(value) =>
                      resumes.find((r) => r.id === value)?.title ??
                      "Choisir un CV..."
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Job details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Poste visé</Label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Développeur Full-Stack"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Entreprise</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Google"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Destinataire (optionnel)</Label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Mme Dupont"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">
                {"Description du poste / offre d'emploi"}
              </Label>
              <textarea
                className="flex w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Collez ici la description du poste..."
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Génération en cours..." : "Générer avec l'IA"}
            </Button>

            {/* Preview */}
            {preview && (
              <div className="border rounded-md p-4 bg-muted/30 space-y-3">
                <p className="text-sm font-medium">Aperçu :</p>
                <div
                  className="prose prose-sm max-w-none [&_p]:mb-3"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(preview) }}
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreate}>Créer la lettre</Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={isLoading}
                  >
                    Régénérer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AISettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}

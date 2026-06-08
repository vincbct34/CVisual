"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { ResumeCard } from "@/components/dashboard/resume-card";
import { CoverLetterCard } from "@/components/dashboard/cover-letter-card";
import dynamic from "next/dynamic";

const AIGenerateCoverLetterDialog = dynamic(
  () =>
    import("@/components/ai/ai-cover-letter-dialog").then((m) => ({
      default: m.AIGenerateCoverLetterDialog,
    })),
  { ssr: false },
);
const AILinkedInImportDialog = dynamic(
  () =>
    import("@/components/ai/ai-linkedin-import-dialog").then((m) => ({
      default: m.AILinkedInImportDialog,
    })),
  { ssr: false },
);
const JsonImportDialog = dynamic(
  () =>
    import("@/components/dashboard/json-import-dialog").then((m) => ({
      default: m.JsonImportDialog,
    })),
  { ssr: false },
);
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import { useAI } from "@/hooks/use-ai";
import { toast } from "sonner";
import { AISettingsDialog } from "@/components/ai/ai-settings-dialog";
import { PageLoading } from "@/components/ui/page-loading";

interface Resume {
  id: string;
  title: string;
  language: string;
  template: string;
  updatedAt: string;
}

interface CoverLetter {
  id: string;
  title: string;
  language: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { authFetch, isLoading: authLoading } = useAuth();
  const { hasKey } = useAI();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showAICoverLetter, setShowAICoverLetter] = useState(false);
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const [resumeResult, clResult] = await Promise.allSettled([
        authFetch("/api/cv"),
        authFetch("/api/cover-letters"),
      ]);
      if (resumeResult.status === "fulfilled" && resumeResult.value.ok) {
        const data = await resumeResult.value.json();
        setResumes(data.resumes);
      }
      if (clResult.status === "fulfilled" && clResult.value.ok) {
        const data = await clResult.value.json();
        setCoverLetters(data.coverLetters);
      }
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!authLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
  }, [authLoading, fetchData]);

  async function handleCreateResume() {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await authFetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/editor/${data.resume.id}`);
      }
    } catch {
      toast.error("Erreur lors de la création du CV");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCreateCoverLetter() {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await authFetch("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/cover-letter/${data.coverLetter.id}`);
      }
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  }

  function handleDeleteResume(id: string) {
    setResumes((prev) => prev.filter((r) => r.id !== id));
  }

  function handleDeleteCoverLetter(id: string) {
    setCoverLetters((prev) => prev.filter((cl) => cl.id !== id));
  }

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      <DashboardHeader />
      <main className="container mx-auto flex-1 px-4 py-8">
        <Tabs defaultValue="resumes">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="resumes">
                Mes CV ({resumes.length})
              </TabsTrigger>
              <TabsTrigger value="cover-letters">
                Mes lettres ({coverLetters.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="resumes">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2
                  className="text-2xl font-extrabold tracking-tight"
                  style={{
                    color: "var(--fg)",
                    fontFamily: "var(--serif)",
                  }}
                >
                  Mes CV
                </h2>
                <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
                  {resumes.length === 0
                    ? "Vous n'avez pas encore de CV"
                    : `${resumes.length} CV`}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="btn-chip"
                  onClick={() => setShowLinkedInImport(true)}
                >
                  Importer LinkedIn
                </button>
                <button
                  className="btn-chip"
                  onClick={() => setShowJsonImport(true)}
                >
                  Importer JSON
                </button>
                <button
                  className="btn-gradient"
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem",
                    opacity: isCreating ? 0.7 : 1,
                  }}
                  onClick={handleCreateResume}
                  disabled={isCreating}
                >
                  {isCreating ? "Création..." : "Nouveau CV"}
                </button>
              </div>
            </div>

            {resumes.length === 0 ? (
              <FadeUp className="flex flex-col items-center justify-center py-16 text-center">
                <p
                  className="text-lg mb-6"
                  style={{ color: "var(--fg-muted)" }}
                >
                  Créez votre premier CV professionnel
                </p>
                <button
                  className="btn-gradient"
                  style={{
                    padding: "0.875rem 2rem",
                    opacity: isCreating ? 0.7 : 1,
                  }}
                  onClick={handleCreateResume}
                  disabled={isCreating}
                >
                  {isCreating ? "Création..." : "Créer un CV"}
                </button>
              </FadeUp>
            ) : (
              <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {resumes.map((resume) => (
                  <StaggerItem key={resume.id}>
                    <ResumeCard
                      resume={resume}
                      onDelete={handleDeleteResume}
                      onDuplicate={fetchData}
                    />
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </TabsContent>

          <TabsContent value="cover-letters">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2
                  className="text-2xl font-extrabold tracking-tight"
                  style={{
                    color: "var(--fg)",
                    fontFamily: "var(--serif)",
                  }}
                >
                  Mes lettres de motivation
                </h2>
                <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
                  {coverLetters.length === 0
                    ? "Vous n'avez pas encore de lettre"
                    : `${coverLetters.length} lettre${coverLetters.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-chip"
                  style={{
                    color: hasKey ? "var(--ink)" : "var(--fg-muted)",
                    opacity: hasKey ? 1 : 0.45,
                    cursor: hasKey ? "pointer" : "not-allowed",
                  }}
                  title={hasKey ? undefined : "Clé API IA non configurée"}
                  onClick={() => {
                    if (!hasKey) {
                      toast.warning("Fonctionnalité IA non configurée", {
                        description:
                          "Ajoutez une clé API dans vos paramètres pour générer une lettre de motivation.",
                        action: {
                          label: "Configurer",
                          onClick: () => setShowAISettings(true),
                        },
                      });
                      return;
                    }
                    setShowAICoverLetter(true);
                  }}
                >
                  ✦ Générer avec l&apos;IA
                </button>
                <button
                  className="btn-gradient"
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem",
                    opacity: isCreating ? 0.7 : 1,
                  }}
                  onClick={handleCreateCoverLetter}
                  disabled={isCreating}
                >
                  {isCreating ? "Création..." : "Nouvelle lettre"}
                </button>
              </div>
            </div>

            {coverLetters.length === 0 ? (
              <FadeUp className="flex flex-col items-center justify-center py-16 text-center">
                <p
                  className="text-lg mb-6"
                  style={{ color: "var(--fg-muted)" }}
                >
                  Créez votre première lettre de motivation
                </p>
                <button
                  className="btn-gradient"
                  style={{
                    padding: "0.875rem 2rem",
                    opacity: isCreating ? 0.7 : 1,
                  }}
                  onClick={handleCreateCoverLetter}
                  disabled={isCreating}
                >
                  {isCreating ? "Création..." : "Créer une lettre"}
                </button>
              </FadeUp>
            ) : (
              <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {coverLetters.map((cl) => (
                  <StaggerItem key={cl.id}>
                    <CoverLetterCard
                      coverLetter={cl}
                      onDelete={handleDeleteCoverLetter}
                      onDuplicate={fetchData}
                    />
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </TabsContent>
        </Tabs>

        <AIGenerateCoverLetterDialog
          open={showAICoverLetter}
          onOpenChange={setShowAICoverLetter}
        />
        <AILinkedInImportDialog
          open={showLinkedInImport}
          onOpenChange={setShowLinkedInImport}
        />
        <JsonImportDialog
          open={showJsonImport}
          onOpenChange={setShowJsonImport}
        />
        <AISettingsDialog
          open={showAISettings}
          onOpenChange={setShowAISettings}
        />
      </main>
    </div>
  );
}

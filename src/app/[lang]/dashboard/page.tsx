"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocalizedRouter } from "@/components/i18n/link";
import { useT } from "@/components/i18n/language-provider";
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
  const t = useT();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showAICoverLetter, setShowAICoverLetter] = useState(false);
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const router = useLocalizedRouter();

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
      toast.error(t("dashboard.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, t]);

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
      toast.error(t("dashboard.createResumeError"));
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
      toast.error(t("dashboard.createError"));
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
                {t("dashboard.tabResumes", { count: resumes.length })}
              </TabsTrigger>
              <TabsTrigger value="cover-letters">
                {t("dashboard.tabLetters", { count: coverLetters.length })}
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
                  {t("dashboard.resumesTitle")}
                </h2>
                <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
                  {resumes.length === 0
                    ? t("dashboard.noResumes")
                    : t(
                        resumes.length === 1
                          ? "dashboard.resumeCountOne"
                          : "dashboard.resumeCountOther",
                        { count: resumes.length },
                      )}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="btn-chip"
                  onClick={() => setShowLinkedInImport(true)}
                >
                  {t("dashboard.importLinkedin")}
                </button>
                <button
                  className="btn-chip"
                  onClick={() => setShowJsonImport(true)}
                >
                  {t("dashboard.importJson")}
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
                  {isCreating
                    ? t("dashboard.creating")
                    : t("dashboard.newResume")}
                </button>
              </div>
            </div>

            {resumes.length === 0 ? (
              <FadeUp className="flex flex-col items-center justify-center py-16 text-center">
                <p
                  className="text-lg mb-6"
                  style={{ color: "var(--fg-muted)" }}
                >
                  {t("dashboard.firstResume")}
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
                  {isCreating
                    ? t("dashboard.creating")
                    : t("dashboard.createResume")}
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
                  {t("dashboard.lettersTitle")}
                </h2>
                <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
                  {coverLetters.length === 0
                    ? t("dashboard.noLetters")
                    : t(
                        coverLetters.length === 1
                          ? "dashboard.letterCountOne"
                          : "dashboard.letterCountOther",
                        { count: coverLetters.length },
                      )}
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
                  title={
                    hasKey ? undefined : t("dashboard.aiNotConfiguredTitle")
                  }
                  onClick={() => {
                    if (!hasKey) {
                      toast.warning(t("dashboard.aiWarnTitle"), {
                        description: t("dashboard.aiWarnDesc"),
                        action: {
                          label: t("dashboard.configure"),
                          onClick: () => setShowAISettings(true),
                        },
                      });
                      return;
                    }
                    setShowAICoverLetter(true);
                  }}
                >
                  {t("dashboard.generateAI")}
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
                  {isCreating
                    ? t("dashboard.creating")
                    : t("dashboard.newLetter")}
                </button>
              </div>
            </div>

            {coverLetters.length === 0 ? (
              <FadeUp className="flex flex-col items-center justify-center py-16 text-center">
                <p
                  className="text-lg mb-6"
                  style={{ color: "var(--fg-muted)" }}
                >
                  {t("dashboard.firstLetter")}
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
                  {isCreating
                    ? t("dashboard.creating")
                    : t("dashboard.createLetter")}
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

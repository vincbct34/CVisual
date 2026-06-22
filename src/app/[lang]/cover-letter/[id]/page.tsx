"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useLocalizedRouter } from "@/components/i18n/link";
import { useT } from "@/components/i18n/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { AISetupBanner } from "@/components/ai/ai-setup-banner";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () =>
    import("@/components/editor/rich-text-editor").then((m) => ({
      default: m.RichTextEditor,
    })),
  { ssr: false },
);
import { CoverLetterTemplate } from "@/components/templates/cover-letter-template";
import { SignaturePad } from "@/components/editor/signature-pad";
import { PagedPreview } from "@/components/editor/paged-preview";
import { CoverLetterStylePanel } from "@/components/editor/cover-letter-style-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type {
  CoverLetter,
  CoverLetterContent,
  CoverLetterStyle,
} from "@/types/cover-letter";
import {
  DEFAULT_COVER_LETTER_CONTENT,
  DEFAULT_COVER_LETTER_STYLE,
} from "@/types/cover-letter";
import { useResizablePanels } from "@/hooks/use-resizable-panels";
import { useAutosave } from "@/hooks/use-autosave";
import { downloadExport, RateLimitError } from "@/lib/export-download";
import { PageLoading } from "@/components/ui/page-loading";

/**
 * Compose the date line in the letter's own language:
 * FR "Paris, le 6 juin 2026" / "Le 6 juin 2026";
 * EN "New York, June 6, 2026" / "June 6, 2026".
 */
function composeLetterDate(city: string, iso: string, lang: string): string {
  if (!iso) return city ? `${city},` : "";
  const intlLocale = lang === "fr" ? "fr-FR" : "en-US";
  let day = "";
  try {
    day = new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${iso}T00:00:00`));
  } catch {
    return city;
  }
  if (lang === "fr") {
    return city ? `${city}, le ${day}` : `Le ${day}`;
  }
  return city ? `${city}, ${day}` : day;
}

export default function CoverLetterEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { authFetch, isLoading: authLoading } = useAuth();
  const t = useT();
  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Set to the chosen format while the "save before export" dialog is open.
  const [pendingExportFormat, setPendingExportFormat] = useState<string | null>(
    null,
  );
  const router = useLocalizedRouter();

  const {
    mainAreaRef,
    leftWidth,
    previewCollapsed,
    isDragging,
    startResize,
    togglePreview,
  } = useResizablePanels("cvisual_cl");

  const fetchLetter = useCallback(async () => {
    try {
      const res = await authFetch(`/api/cover-letters/${id}`);
      if (res.ok) {
        const data = await res.json();
        setLetter(data.coverLetter);
      } else {
        toast.error(t("cl.notFound"));
        router.push("/dashboard");
      }
    } catch {
      toast.error(t("cl.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, id, router, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading) fetchLetter();
  }, [authLoading, fetchLetter]);

  // Manual save (button / flush) + slow 30s safety-net autosave; live editing
  // stays local so saves are explicit single requests, not per-keystroke.
  const {
    isSaving,
    isDirty,
    schedule: autoSave,
    flush: saveNow,
  } = useAutosave<CoverLetter>(
    useCallback(
      async (updated) => {
        try {
          const res = await authFetch(`/api/cover-letters/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: updated.title,
              content: updated.content,
              style: updated.style,
              language: updated.language,
            }),
          });
          if (!res.ok) throw new Error();
        } catch {
          toast.error(t("cl.saveError"));
          throw new Error("Save failed"); // keep dirty so changes aren't lost
        }
      },
      [authFetch, id, t],
    ),
    30_000,
  );

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function updateLetter(changes: Partial<CoverLetter>) {
    if (!letter) return;
    const updated = { ...letter, ...changes };
    setLetter(updated);
    autoSave(updated);
  }

  function updateContent(field: keyof CoverLetterContent, value: string) {
    if (!letter) return;
    const content = {
      ...(letter.content as unknown as CoverLetterContent),
      [field]: value,
    };
    updateLetter({ content } as Partial<CoverLetter>);
  }

  function updateContentFields(fields: Partial<CoverLetterContent>) {
    if (!letter) return;
    const content = {
      ...(letter.content as unknown as CoverLetterContent),
      ...fields,
    };
    updateLetter({ content } as Partial<CoverLetter>);
  }

  function handleSignatureUpload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("cl.imageOnly"));
      return;
    }
    if (file.size > 2_000_000) {
      toast.error(t("cl.imageTooBig"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      updateContent("signatureImage", String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function runExport(format: string) {
    try {
      await downloadExport(
        authFetch,
        `/api/cover-letters/${id}/export`,
        format,
        letter?.title ?? "",
        "lettre",
      );
      toast.success(t("cl.exportSuccess", { format: format.toUpperCase() }));
    } catch (e) {
      toast.error(
        e instanceof RateLimitError
          ? e.message
          : t("cl.exportError", { format: format.toUpperCase() }),
      );
    }
  }

  // Export renders server-side from the DB, so unsaved local edits wouldn't
  // appear in the file. With pending changes, open the dialog to let the user
  // save first; otherwise export straight away.
  function handleExport(format: string) {
    if (isDirty) {
      setPendingExportFormat(format);
      return;
    }
    void runExport(format);
  }

  async function saveThenExport() {
    const format = pendingExportFormat;
    setPendingExportFormat(null);
    if (!format) return;
    if (!(await saveNow())) {
      toast.error(t("cl.saveFailedExportCancelled"));
      return;
    }
    await runExport(format);
  }

  function exportWithoutSaving() {
    const format = pendingExportFormat;
    setPendingExportFormat(null);
    if (format) void runExport(format);
  }

  if (authLoading || isLoading || !letter) {
    return <PageLoading />;
  }

  const content =
    (letter.content as unknown as CoverLetterContent) ??
    DEFAULT_COVER_LETTER_CONTENT;
  const style =
    (letter.style as unknown as CoverLetterStyle) ?? DEFAULT_COVER_LETTER_STYLE;

  return (
    <div
      className="min-h-screen flex flex-col lg:h-screen lg:overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <DashboardHeader />

      {/* Toolbar */}
      <div className="glass-toolbar px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-40">
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            ← <span className="hidden sm:inline">{t("common.back")}</span>
          </Button>
          <Input
            value={letter.title}
            onChange={(e) => updateLetter({ title: e.target.value })}
            className="flex-1 min-w-0 sm:flex-none sm:w-64 h-8 text-sm font-medium"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
          <span
            className="hidden sm:inline text-xs"
            style={{ color: "var(--fg-muted)" }}
          >
            {isSaving
              ? t("common.saving")
              : isDirty
                ? t("editor.unsaved")
                : t("common.saved")}
          </span>
          <Button
            size="sm"
            onClick={saveNow}
            disabled={isSaving || !isDirty}
            title={t("editor.saveTitle")}
          >
            {t("common.save")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:inline-flex"
            onClick={togglePreview}
            title={
              previewCollapsed
                ? t("editor.showPreview")
                : t("editor.expandEditorTitle")
            }
          >
            {previewCollapsed
              ? t("editor.showPreview")
              : t("editor.expandEditor")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="export-trigger">
              {t("editor.exportMenu")}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 max-w-[calc(100vw-2rem)]"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal whitespace-normal text-muted-foreground">
                  {t("cl.exportNote")}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                PDF
                <span className="ml-auto pl-3 text-xs text-muted-foreground">
                  {t("editor.exportPdfHint")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("docx")}>
                {t("editor.exportDocxLabel")}
                <span className="ml-auto pl-3 text-xs text-muted-foreground">
                  {t("editor.exportEditable")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("html")}>
                HTML
                <span className="ml-auto pl-3 text-xs text-muted-foreground">
                  {t("editor.exportEditable")}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog
            open={pendingExportFormat !== null}
            onOpenChange={(open) => {
              if (!open) setPendingExportFormat(null);
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("editor.exportUnsavedTitle")}</DialogTitle>
                <DialogDescription>
                  {t("editor.exportUnsavedDesc")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={() => setPendingExportFormat(null)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={exportWithoutSaving}
                >
                  {t("editor.exportWithoutSaving")}
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={saveThenExport}
                  disabled={isSaving}
                >
                  {t("editor.saveAndExport")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main editor area */}
      <div
        ref={mainAreaRef}
        className="flex flex-col lg:flex-row flex-1 lg:min-h-0 lg:overflow-hidden"
        style={
          {
            "--editor-left-width": previewCollapsed ? "100%" : `${leftWidth}px`,
          } as React.CSSProperties
        }
      >
        {/* Left panel — editing */}
        <div className="w-full editor-left-panel lg:overflow-y-auto p-4 space-y-4">
          <Tabs defaultValue="content">
            <TabsList className="w-full">
              <TabsTrigger value="content" className="flex-1">
                {t("cl.tabContent")}
              </TabsTrigger>
              <TabsTrigger value="style" className="flex-1">
                {t("editor.tabStyle")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <AISetupBanner />

              {/* Expéditeur */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t("cl.sender")}</Label>
                <div className="space-y-1">
                  <Label className="text-xs">{t("cl.name")}</Label>
                  <Input
                    value={content.senderName ?? ""}
                    onChange={(e) =>
                      updateContent("senderName", e.target.value)
                    }
                    placeholder={t("cl.namePh")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("forms.email")}</Label>
                    <Input
                      value={content.senderEmail ?? ""}
                      onChange={(e) =>
                        updateContent("senderEmail", e.target.value)
                      }
                      placeholder={t("cl.emailPh")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("forms.phone")}</Label>
                    <Input
                      value={content.senderPhone ?? ""}
                      onChange={(e) =>
                        updateContent("senderPhone", e.target.value)
                      }
                      placeholder={t("cl.phonePh")}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("cl.place")}</Label>
                  <Input
                    value={content.senderLocation ?? ""}
                    onChange={(e) =>
                      updateContent("senderLocation", e.target.value)
                    }
                    placeholder={t("cl.placePh")}
                  />
                </div>
              </div>

              <Separator />

              {/* Destinataire */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {t("cl.recipient")}
                </Label>
                <div className="space-y-1">
                  <Label className="text-xs">{t("cl.recipientName")}</Label>
                  <Input
                    value={content.recipientName}
                    onChange={(e) =>
                      updateContent("recipientName", e.target.value)
                    }
                    placeholder={t("cl.recipientNamePh")}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("cl.company")}</Label>
                  <Input
                    value={content.companyName}
                    onChange={(e) =>
                      updateContent("companyName", e.target.value)
                    }
                    placeholder={t("cl.companyPh")}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("cl.jobTitle")}</Label>
                  <Input
                    value={content.jobTitle}
                    onChange={(e) => updateContent("jobTitle", e.target.value)}
                    placeholder={t("cl.jobTitlePh")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("cl.city")}</Label>
                    <Input
                      value={content.dateCity ?? ""}
                      onChange={(e) =>
                        updateContentFields({
                          dateCity: e.target.value,
                          date: composeLetterDate(
                            e.target.value,
                            content.dateValue ?? "",
                            letter.language,
                          ),
                        })
                      }
                      placeholder={t("cl.cityPh")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("cl.date")}</Label>
                    <Input
                      type="date"
                      value={content.dateValue ?? ""}
                      onChange={(e) =>
                        updateContentFields({
                          dateValue: e.target.value,
                          date: composeLetterDate(
                            content.dateCity ?? "",
                            e.target.value,
                            letter.language,
                          ),
                        })
                      }
                    />
                  </div>
                </div>
                {content.date && (
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                    {t("cl.datePreview", { date: content.date })}
                  </p>
                )}
              </div>

              <Separator />

              {/* Corps */}
              <div className="space-y-1">
                <Label className="text-xs">{t("cl.body")}</Label>
                <RichTextEditor
                  content={content.body}
                  onChange={(html) => updateContent("body", html)}
                  placeholder={t("cl.bodyPh")}
                  aiContext={t("cl.bodyAiContext", {
                    job: content.jobTitle,
                    company: content.companyName,
                  })}
                />
              </div>

              <Separator />

              {/* Signature */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {t("cl.signature")}
                </Label>

                {/* Mode selector */}
                <div className="grid grid-cols-3 gap-1 rounded-md border p-1">
                  {(
                    [
                      ["typed", t("cl.sigTyped")],
                      ["draw", t("cl.sigDraw")],
                      ["upload", t("cl.sigUpload")],
                    ] as const
                  ).map(([mode, label]) => {
                    const active = (content.signatureMode ?? "typed") === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => updateContent("signatureMode", mode)}
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Name — used as the typed signature and the printed name below
                    a drawn/uploaded signature */}
                <div className="space-y-1">
                  <Label className="text-xs">{t("cl.sigName")}</Label>
                  <Input
                    value={content.signature ?? ""}
                    onChange={(e) => updateContent("signature", e.target.value)}
                    placeholder={t("cl.sigNamePh")}
                  />
                </div>

                {(content.signatureMode ?? "typed") === "draw" && (
                  <SignaturePad
                    value={content.signatureImage}
                    color={style.primaryColor}
                    onChange={(url) => updateContent("signatureImage", url)}
                  />
                )}

                {(content.signatureMode ?? "typed") === "upload" && (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) =>
                        handleSignatureUpload(e.target.files?.[0])
                      }
                    />
                    {content.signatureImage && (
                      <div className="flex items-center justify-between gap-2">
                        <img
                          src={content.signatureImage}
                          alt={t("cl.sigAlt")}
                          className="h-12 rounded border bg-white object-contain p-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => updateContent("signatureImage", "")}
                        >
                          {t("cl.sigRemove")}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="style" className="mt-4">
              <CoverLetterStylePanel
                style={style}
                onStyleChange={(s) => updateLetter({ style: s })}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Draggable divider (desktop only) */}
        {!previewCollapsed && (
          <div
            className={`editor-resizer${isDragging ? " dragging" : ""}`}
            onPointerDown={startResize}
            role="separator"
            aria-orientation="vertical"
            aria-label={t("editor.resizePanels")}
          >
            <div className="editor-resizer-grip" />
          </div>
        )}

        {/* Right panel — preview */}
        <div
          className={`flex-1 overflow-auto editor-preview-area p-3 sm:p-4 lg:p-6${
            previewCollapsed ? " hidden" : ""
          }`}
        >
          <PagedPreview>
            <CoverLetterTemplate content={content} style={style} />
          </PagedPreview>
        </div>
      </div>
    </div>
  );
}

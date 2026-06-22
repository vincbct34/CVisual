"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useLocalizedRouter } from "@/components/i18n/link";
import { useT } from "@/components/i18n/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { AISetupBanner } from "@/components/ai/ai-setup-banner";
import { SectionForm } from "@/components/editor/section-forms";
import { StylePanel } from "@/components/editor/style-panel";
import { ResumePreview } from "@/components/editor/resume-preview";
import { SortableSection } from "@/components/editor/sortable-section";
import { TemplatePreviewModal } from "@/components/editor/template-preview-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import type { Resume, ResumeStyle } from "@/types/resume";
import { SECTION_TYPES } from "@/types/resume";
import { useCompletenessScore } from "@/hooks/use-completeness";
import { useResizablePanels } from "@/hooks/use-resizable-panels";
import { useAutosave } from "@/hooks/use-autosave";
import { downloadExport, RateLimitError } from "@/lib/export-download";
import { PageLoading } from "@/components/ui/page-loading";

const AIAtsScoreButton = dynamic(
  () =>
    import("@/components/ai/ai-ats-score-button").then((m) => ({
      default: m.AIAtsScoreButton,
    })),
  { ssr: false },
);
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export default function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { authFetch, isLoading: authLoading } = useAuth();
  const t = useT();
  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
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
  } = useResizablePanels("cvisual_editor");

  const completeness = useCompletenessScore(resume);

  async function togglePublic() {
    if (!resume) return;
    try {
      const res = await authFetch(`/api/cv/${id}/public`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !resume.isPublic }),
      });
      if (res.ok) {
        const data = await res.json();
        setResume({ ...resume, isPublic: data.isPublic });
        toast.success(
          data.isPublic ? t("editor.madePublic") : t("editor.madePrivate"),
        );
      }
    } catch {
      toast.error(t("editor.updateError"));
    }
  }

  async function copyPublicLink() {
    const url = `${window.location.origin}/public/cv/${id}`;
    await navigator.clipboard.writeText(url);
    toast.success(t("editor.linkCopied"));
  }

  async function copyShareLink() {
    try {
      const res = await authFetch(`/api/cv/${id}/share`);
      if (!res.ok) throw new Error();
      const { url } = (await res.json()) as { url: string };
      await navigator.clipboard.writeText(url);
      toast.success(t("editor.shareLinkCopied"));
    } catch {
      toast.error(t("editor.shareLinkError"));
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fetchResume = useCallback(async () => {
    try {
      const res = await authFetch(`/api/cv/${id}`);
      if (res.ok) {
        const data = await res.json();
        setResume(data.resume);
      } else {
        toast.error(t("editor.notFound"));
        router.push("/dashboard");
      }
    } catch {
      toast.error(t("editor.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, id, router, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading) fetchResume();
  }, [authLoading, fetchResume]);

  // Manual save (button / flush) with a slow 30s safety-net autosave. Live
  // editing stays local — the preview re-renders for free — so a save is an
  // explicit, single batched request rather than a per-keystroke storm.
  const {
    isSaving,
    isDirty,
    schedule: autoSave,
    flush: saveNow,
  } = useAutosave<Resume>(
    useCallback(
      async (updatedResume) => {
        let res: Response;
        try {
          // One request: resume metadata + every section, batched server-side.
          res = await authFetch(`/api/cv/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: updatedResume.title,
              template: updatedResume.template,
              style: updatedResume.style,
              language: updatedResume.language,
              sections: updatedResume.sections.map((s) => ({
                id: s.id,
                title: s.title,
                content: s.content,
                order: s.order,
                visible: s.visible,
              })),
            }),
          });
        } catch {
          // Network failure — fetch threw before any response.
          toast.error(t("editor.saveError"));
          throw new Error("Save failed"); // keep dirty so changes aren't lost
        }
        if (res.ok) return;
        // Single toast per failure: 429 gets its own message, everything else
        // the generic one. Re-throw either way to stay dirty.
        toast.error(
          res.status === 429
            ? t("editor.saveRateLimit")
            : t("editor.saveError"),
        );
        throw new Error("Save failed");
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

  function updateResume(changes: Partial<Resume>) {
    if (!resume) return;
    const updated = { ...resume, ...changes };
    setResume(updated);
    autoSave(updated);
  }

  function updateSection(sectionId: string, content: Record<string, unknown>) {
    if (!resume) return;
    const updated = {
      ...resume,
      sections: resume.sections.map((s) =>
        s.id === sectionId ? { ...s, content } : s,
      ),
    };
    setResume(updated);
    autoSave(updated);
  }

  function updateSectionTitle(sectionId: string, title: string) {
    if (!resume) return;
    const updated = {
      ...resume,
      sections: resume.sections.map((s) =>
        s.id === sectionId ? { ...s, title } : s,
      ),
    };
    setResume(updated);
    autoSave(updated);
  }

  function toggleSectionVisibility(sectionId: string) {
    if (!resume) return;
    const updated = {
      ...resume,
      sections: resume.sections.map((s) =>
        s.id === sectionId ? { ...s, visible: !s.visible } : s,
      ),
    };
    setResume(updated);
    autoSave(updated);
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (!resume) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentDraggable = sortedSections.filter((s) => s.type !== "profile");
    const oldIndex = currentDraggable.findIndex((s) => s.id === active.id);
    const newIndex = currentDraggable.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...currentDraggable];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Profile stays at order 0, draggable sections start at order 1
    const profileSections = resume.sections
      .filter((s) => s.type === "profile")
      .map((s) => ({ ...s, order: 0 }));
    const updatedDraggable = reordered.map((s, i) => ({ ...s, order: i + 1 }));
    const updatedSections = [...profileSections, ...updatedDraggable];
    const previousSections = resume.sections;
    const updated = { ...resume, sections: updatedSections };
    setResume(updated);

    // Persist reorder
    try {
      const res = await authFetch(`/api/cv/${id}/sections/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: updatedSections.map((s) => ({ id: s.id, order: s.order })),
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error(t("editor.reorderError"));
      setResume({ ...resume, sections: previousSections });
    }
  }

  async function addSection(type: string) {
    if (!resume) return;
    const sectionType = SECTION_TYPES.find((s) => s.type === type);
    const title = sectionType?.label ?? t("editor.newSection");

    try {
      const res = await authFetch(`/api/cv/${id}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          content: type === "custom" ? { text: "" } : { items: [] },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResume({
          ...resume,
          sections: [...resume.sections, data.section],
        });
        toast.success(t("editor.sectionAdded"));
      }
    } catch {
      toast.error(t("editor.addError"));
    }
  }

  async function deleteSection(sectionId: string) {
    if (!resume) return;
    try {
      await authFetch(`/api/cv/${id}/sections/${sectionId}`, {
        method: "DELETE",
      });
      setResume({
        ...resume,
        sections: resume.sections.filter((s) => s.id !== sectionId),
      });
      toast.success(t("editor.sectionDeleted"));
    } catch {
      toast.error(t("editor.deleteError"));
    }
  }

  async function runExport(format: string) {
    try {
      await downloadExport(
        authFetch,
        `/api/cv/${id}/export`,
        format,
        resume?.title ?? "",
        "cv",
      );
      toast.success(
        t("editor.exportSuccess", { format: format.toUpperCase() }),
      );
    } catch (e) {
      toast.error(
        e instanceof RateLimitError
          ? e.message
          : t("editor.exportError", { format: format.toUpperCase() }),
      );
    }
  }

  // Export renders server-side from the DB, so unsaved local edits (style,
  // sections…) wouldn't appear in the file. With pending changes, open the
  // dialog to let the user save first; otherwise export straight away.
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
      toast.error(t("editor.saveFailedExportCancelled"));
      return;
    }
    await runExport(format);
  }

  function exportWithoutSaving() {
    const format = pendingExportFormat;
    setPendingExportFormat(null);
    if (format) void runExport(format);
  }

  if (authLoading || isLoading || !resume) {
    return <PageLoading />;
  }

  const sortedSections = [...resume.sections].sort((a, b) => a.order - b.order);
  const draggableSections = sortedSections.filter((s) => s.type !== "profile");

  const existingTypes = new Set(resume.sections.map((s) => s.type));
  const availableSections = SECTION_TYPES.filter(
    (s) => s.type === "custom" || !existingTypes.has(s.type),
  );

  return (
    <div
      className="min-h-screen flex flex-col lg:h-screen lg:overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <DashboardHeader />
      <TemplatePreviewModal
        open={showTemplatePreview}
        onOpenChange={setShowTemplatePreview}
        resume={resume}
        currentTemplate={resume.template}
        onSelect={(template) => updateResume({ template })}
      />

      {/* Toolbar */}
      <div className="glass-toolbar px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-40">
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            ← <span className="hidden sm:inline">{t("common.back")}</span>
          </Button>
          <Input
            value={resume.title}
            onChange={(e) => updateResume({ title: e.target.value })}
            className="flex-1 min-w-0 sm:flex-none sm:w-48 h-8 text-sm font-medium"
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
          <Dialog>
            <DialogTrigger render={<Button variant="ghost" size="sm" />}>
              {t("editor.share")}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md lg:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("editor.shareTitle")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("editor.publicLink")}</Label>
                    <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                      {t("editor.publicLinkDesc")}
                    </p>
                  </div>
                  {/* Toggle switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={resume.isPublic}
                      onChange={togglePublic}
                    />
                    <div
                      className="w-11 h-6 rounded-full transition-colors peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all relative"
                      style={{
                        background: resume.isPublic
                          ? "var(--accent-violet)"
                          : "var(--input-bg)",
                        border: "1px solid var(--input-border)",
                      }}
                    />
                  </label>
                </div>
                {resume.isPublic && (
                  <div className="flex gap-2 mt-4">
                    <Input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/public/cv/${id}`}
                    />
                    <Button onClick={copyPublicLink}>{t("editor.copy")}</Button>
                  </div>
                )}
                <Separator />
                <div className="space-y-0.5">
                  <Label>{t("editor.secureShareLink")}</Label>
                  <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                    {t("editor.secureShareDesc")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={copyShareLink}
                >
                  {t("editor.copyShareLink")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
          <AIAtsScoreButton resume={resume} />
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
                  {t("editor.exportNote")}
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
              <DropdownMenuItem onClick={() => handleExport("json")}>
                JSON
                <span className="ml-auto pl-3 text-xs text-muted-foreground">
                  {t("editor.exportReimportable")}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <Tabs defaultValue="sections">
            <TabsList className="w-full">
              <TabsTrigger value="sections" className="flex-1">
                {t("editor.tabSections")}
              </TabsTrigger>
              <TabsTrigger value="style" className="flex-1">
                {t("editor.tabStyle")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="space-y-4 mt-4">
              {/* Bannière IA si pas de clé configurée */}
              <AISetupBanner />

              {/* Completeness indicator */}
              <div
                className="p-3 space-y-2"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "var(--radius)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--fg)" }}
                  >
                    {t("editor.completeness")}
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--accent-violet)" }}
                  >
                    {completeness.score}%
                  </span>
                </div>
                <div className="completeness-bar">
                  <div
                    className="completeness-fill"
                    style={{ width: `${completeness.score}%` }}
                  />
                </div>
                {completeness.missing.length > 0 && (
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                    {t("editor.missing", {
                      items: completeness.missing.slice(0, 3).join(", "),
                    })}
                    {completeness.missing.length > 3 &&
                      ` +${completeness.missing.length - 3}`}
                  </p>
                )}
              </div>

              {/* Add section */}
              <div className="flex items-center gap-2">
                <Select
                  value={null}
                  onValueChange={(type) => type && addSection(String(type))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue
                      placeholder={t("editor.addSectionPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((s) => (
                      <SelectItem key={s.type} value={s.type}>
                        {t(`sectionTypes.${s.type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Profile section (always first, not draggable) */}
              {sortedSections
                .filter((s) => s.type === "profile")
                .map((section) => (
                  <div key={section.id}>
                    <div className="flex items-start gap-1">
                      <div
                        className="mt-2 p-1 text-muted-foreground/40"
                        title={t("editor.profileAlwaysHeader")}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="shrink-0"
                        >
                          <path d="M8 1.5a1.5 1.5 0 0 0-1.5 1.5v4.5h-2l3.5 5 3.5-5h-2V3A1.5 1.5 0 0 0 8 1.5zM3 13h10v1.5H3V13z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <Input
                            value={section.title}
                            onChange={(e) =>
                              updateSectionTitle(section.id, e.target.value)
                            }
                            className="font-semibold text-sm h-8 flex-1 mr-2"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => toggleSectionVisibility(section.id)}
                          >
                            {section.visible
                              ? t("editor.hide")
                              : t("editor.show")}
                          </Button>
                        </div>
                        {section.visible && (
                          <SectionForm
                            section={section}
                            resume={resume}
                            onUpdate={(content) =>
                              updateSection(section.id, content)
                            }
                          />
                        )}
                        <Separator />
                      </div>
                    </div>
                  </div>
                ))}

              {/* Other sections with drag & drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={draggableSections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {draggableSections.map((section) => (
                    <SortableSection key={section.id} section={section}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Input
                            value={section.title}
                            onChange={(e) =>
                              updateSectionTitle(section.id, e.target.value)
                            }
                            className="font-semibold text-sm h-8 flex-1 mr-2"
                          />
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                toggleSectionVisibility(section.id)
                              }
                            >
                              {section.visible ? "Masquer" : "Afficher"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive"
                              onClick={() => deleteSection(section.id)}
                            >
                              X
                            </Button>
                          </div>
                        </div>
                        {section.visible && (
                          <SectionForm
                            section={section}
                            resume={resume}
                            onUpdate={(content) =>
                              updateSection(section.id, content)
                            }
                          />
                        )}
                        <Separator />
                      </div>
                    </SortableSection>
                  ))}
                </SortableContext>
              </DndContext>
            </TabsContent>

            <TabsContent value="style" className="mt-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowTemplatePreview(true)}
              >
                {t("editor.previewAllTemplates")}
              </Button>
              <StylePanel
                template={resume.template}
                style={resume.style}
                sections={resume.sections}
                onTemplateChange={(template) => updateResume({ template })}
                onStyleChange={(style: ResumeStyle) => updateResume({ style })}
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
          className={`flex-1 lg:overflow-hidden editor-preview-area min-h-[70vh] lg:min-h-0${
            previewCollapsed ? " hidden" : ""
          }`}
        >
          <ResumePreview resume={resume} />
        </div>
      </div>
    </div>
  );
}

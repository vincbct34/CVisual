"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
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
import { useDebouncedAutosave } from "@/hooks/use-debounced-autosave";
import { triggerBlobDownload } from "@/lib/utils";

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
  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const router = useRouter();

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
        toast.success(data.isPublic ? "CV rendu public" : "CV rendu privé");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function copyPublicLink() {
    const url = `${window.location.origin}/public/cv/${id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Lien copié dans le presse-papiers !");
  }

  async function copyShareLink() {
    try {
      const res = await authFetch(`/api/cv/${id}/share`);
      if (!res.ok) throw new Error();
      const { url } = (await res.json()) as { url: string };
      await navigator.clipboard.writeText(url);
      toast.success("Lien de partage copié !");
    } catch {
      toast.error("Erreur lors de la génération du lien");
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
        toast.error("CV non trouvé");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, id, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading) fetchResume();
  }, [authLoading, fetchResume]);

  // Debounced auto-save: resume fields + every section
  const { isSaving, schedule: autoSave } = useDebouncedAutosave<Resume>(
    useCallback(
      async (updatedResume) => {
        try {
          const res = await authFetch(`/api/cv/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: updatedResume.title,
              template: updatedResume.template,
              style: updatedResume.style,
              language: updatedResume.language,
            }),
          });
          if (!res.ok) throw new Error("Save failed");

          const failures: string[] = [];
          for (const section of updatedResume.sections) {
            try {
              const sRes = await authFetch(
                `/api/cv/${id}/sections/${section.id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: section.title,
                    content: section.content,
                    order: section.order,
                    visible: section.visible,
                  }),
                },
              );
              if (!sRes.ok) failures.push(section.title);
            } catch {
              failures.push(section.title);
            }
          }
          if (failures.length > 0) {
            toast.error(`Erreur de sauvegarde pour : ${failures.join(", ")}`);
          }
        } catch {
          toast.error("Erreur lors de la sauvegarde");
        }
      },
      [authFetch, id],
    ),
  );

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
      toast.error("Erreur lors du réordonnancement");
      setResume({ ...resume, sections: previousSections });
    }
  }

  async function addSection(type: string) {
    if (!resume) return;
    const sectionType = SECTION_TYPES.find((s) => s.type === type);
    const title = sectionType?.label ?? "Nouvelle section";

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
        toast.success("Section ajoutée");
      }
    } catch {
      toast.error("Erreur lors de l'ajout");
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
      toast.success("Section supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  async function handleExport(format: string) {
    try {
      const res = await authFetch(`/api/cv/${id}/export?format=${format}`);
      if (!res.ok) {
        toast.error(`Erreur lors de l'export ${format.toUpperCase()}`);
        return;
      }

      const blob = await res.blob();
      const ext =
        format === "json"
          ? "json"
          : format === "html"
            ? "html"
            : format === "docx"
              ? "docx"
              : "pdf";
      triggerBlobDownload(blob, `${resume?.title ?? "cv"}.${ext}`);
      toast.success(`${format.toUpperCase()} téléchargé !`);
    } catch {
      toast.error(`Erreur lors de l'export ${format.toUpperCase()}`);
    }
  }

  if (authLoading || isLoading || !resume) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <p style={{ color: "var(--fg-muted)" }}>Chargement...</p>
      </div>
    );
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
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            ← <span className="hidden sm:inline">Retour</span>
          </Button>
          <Input
            value={resume.title}
            onChange={(e) => updateResume({ title: e.target.value })}
            className="w-32 sm:w-48 h-8 text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
            {isSaving ? "Sauvegarde..." : "Sauvegardé"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:inline-flex"
            onClick={togglePreview}
            title={
              previewCollapsed
                ? "Afficher l'aperçu"
                : "Agrandir l'éditeur (masquer l'aperçu)"
            }
          >
            {previewCollapsed ? "Afficher l'aperçu" : "Agrandir l'éditeur"}
          </Button>
          <Dialog>
            <DialogTrigger render={<Button variant="ghost" size="sm" />}>
              Partager
            </DialogTrigger>
            <DialogContent className="sm:max-w-md lg:max-w-lg">
              <DialogHeader>
                <DialogTitle>Partager ce CV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lien public</Label>
                    <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                      Permet à quiconque ayant le lien de voir votre CV.
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
                    <Button onClick={copyPublicLink}>Copier</Button>
                  </div>
                )}
                <Separator />
                <div className="space-y-0.5">
                  <Label>Lien de partage sécurisé</Label>
                  <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                    Générez un lien unique pour partager ce CV sans le rendre
                    public.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={copyShareLink}
                >
                  Copier le lien de partage
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <AIAtsScoreButton resume={resume} />
          <DropdownMenu>
            <DropdownMenuTrigger className="export-trigger">
              Exporter ▾
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 max-w-[calc(100vw-2rem)]"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal whitespace-normal text-muted-foreground">
                  Pour conserver la mise en page exacte de votre modèle,
                  exportez en PDF. Les autres formats sont modifiables mais
                  simplifiés.
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                PDF
                <span className="ml-auto pl-3 text-xs text-muted-foreground">
                  mise en page exacte
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("docx")}>
                DOCX (Word)
                <span className="ml-auto pl-3 text-xs text-muted-foreground">
                  modifiable
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("html")}>
                HTML
                <span className="ml-auto pl-3 text-xs text-muted-foreground">
                  modifiable
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                JSON
                <span className="ml-auto pl-3 text-xs text-muted-foreground">
                  réimportable
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
                Sections
              </TabsTrigger>
              <TabsTrigger value="style" className="flex-1">
                Style
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="space-y-4 mt-4">
              {/* Bannière IA si pas de clé configurée */}
              <AISetupBanner />

              {/* Completeness indicator */}
              <div
                className="rounded-xl p-3 space-y-2"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--fg)" }}
                  >
                    Complétude du CV
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
                    Manquant : {completeness.missing.slice(0, 3).join(", ")}
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
                    <SelectValue placeholder="Ajouter une section..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((s) => (
                      <SelectItem key={s.type} value={s.type}>
                        {s.label}
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
                        title="Toujours en en-tête du CV"
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
                            {section.visible ? "Masquer" : "Afficher"}
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
                Prévisualiser tous les templates
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
            aria-label="Redimensionner les panneaux"
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

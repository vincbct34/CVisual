"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
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
import { useDebouncedAutosave } from "@/hooks/use-debounced-autosave";
import { triggerBlobDownload } from "@/lib/utils";

/** Compose the French date line: "Paris, le 6 juin 2026" / "Le 6 juin 2026". */
function composeLetterDate(city: string, iso: string): string {
  if (!iso) return city ? `${city},` : "";
  let day = "";
  try {
    day = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${iso}T00:00:00`));
  } catch {
    return city;
  }
  return city ? `${city}, le ${day}` : `Le ${day}`;
}

export default function CoverLetterEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { authFetch, isLoading: authLoading } = useAuth();
  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
        toast.error("Lettre non trouvée");
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
    if (!authLoading) fetchLetter();
  }, [authLoading, fetchLetter]);

  const { isSaving, schedule: autoSave } = useDebouncedAutosave<CoverLetter>(
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
          toast.error("Erreur lors de la sauvegarde");
        }
      },
      [authFetch, id],
    ),
  );

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
      toast.error("Veuillez choisir une image (PNG ou JPG)");
      return;
    }
    if (file.size > 2_000_000) {
      toast.error("Image trop lourde (max 2 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      updateContent("signatureImage", String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function handleExport(format: string) {
    try {
      const res = await authFetch(
        `/api/cover-letters/${id}/export?format=${format}`,
      );
      if (!res.ok) {
        toast.error(`Erreur lors de l'export ${format.toUpperCase()}`);
        return;
      }
      const blob = await res.blob();
      const ext =
        format === "pdf" ? "pdf" : format === "docx" ? "docx" : "html";
      triggerBlobDownload(blob, `${letter?.title ?? "lettre"}.${ext}`);
      toast.success(`${format.toUpperCase()} téléchargé !`);
    } catch {
      toast.error(`Erreur lors de l'export ${format.toUpperCase()}`);
    }
  }

  if (authLoading || isLoading || !letter) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <p style={{ color: "var(--fg-muted)" }}>Chargement...</p>
      </div>
    );
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
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            ← Retour
          </Button>
          <Input
            value={letter.title}
            onChange={(e) => updateLetter({ title: e.target.value })}
            className="w-40 sm:w-64 h-8 text-sm font-medium"
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
                  Pour conserver la mise en page exacte, exportez en PDF. Les
                  autres formats sont modifiables mais simplifiés.
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
          <Tabs defaultValue="content">
            <TabsList className="w-full">
              <TabsTrigger value="content" className="flex-1">
                Contenu
              </TabsTrigger>
              <TabsTrigger value="style" className="flex-1">
                Style
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <AISetupBanner />

              {/* Expéditeur */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Expéditeur</Label>
                <div className="space-y-1">
                  <Label className="text-xs">Nom</Label>
                  <Input
                    value={content.senderName ?? ""}
                    onChange={(e) =>
                      updateContent("senderName", e.target.value)
                    }
                    placeholder="Jean Martin"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      value={content.senderEmail ?? ""}
                      onChange={(e) =>
                        updateContent("senderEmail", e.target.value)
                      }
                      placeholder="jean@mail.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Téléphone</Label>
                    <Input
                      value={content.senderPhone ?? ""}
                      onChange={(e) =>
                        updateContent("senderPhone", e.target.value)
                      }
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Lieu</Label>
                  <Input
                    value={content.senderLocation ?? ""}
                    onChange={(e) =>
                      updateContent("senderLocation", e.target.value)
                    }
                    placeholder="Paris, France"
                  />
                </div>
              </div>

              <Separator />

              {/* Destinataire */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Destinataire</Label>
                <div className="space-y-1">
                  <Label className="text-xs">Nom du destinataire</Label>
                  <Input
                    value={content.recipientName}
                    onChange={(e) =>
                      updateContent("recipientName", e.target.value)
                    }
                    placeholder="Mme Dupont"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Entreprise</Label>
                  <Input
                    value={content.companyName}
                    onChange={(e) =>
                      updateContent("companyName", e.target.value)
                    }
                    placeholder="Google"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Poste visé</Label>
                  <Input
                    value={content.jobTitle}
                    onChange={(e) => updateContent("jobTitle", e.target.value)}
                    placeholder="Développeur Full-Stack"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Ville</Label>
                    <Input
                      value={content.dateCity ?? ""}
                      onChange={(e) =>
                        updateContentFields({
                          dateCity: e.target.value,
                          date: composeLetterDate(
                            e.target.value,
                            content.dateValue ?? "",
                          ),
                        })
                      }
                      placeholder="Paris"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={content.dateValue ?? ""}
                      onChange={(e) =>
                        updateContentFields({
                          dateValue: e.target.value,
                          date: composeLetterDate(
                            content.dateCity ?? "",
                            e.target.value,
                          ),
                        })
                      }
                    />
                  </div>
                </div>
                {content.date && (
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                    Aperçu : {content.date}
                  </p>
                )}
              </div>

              <Separator />

              {/* Corps */}
              <div className="space-y-1">
                <Label className="text-xs">Corps de la lettre</Label>
                <RichTextEditor
                  content={content.body}
                  onChange={(html) => updateContent("body", html)}
                  placeholder="Rédigez votre lettre de motivation..."
                  aiContext={`Lettre de motivation pour ${content.jobTitle} chez ${content.companyName}`}
                />
              </div>

              <Separator />

              {/* Signature */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Signature</Label>

                {/* Mode selector */}
                <div className="grid grid-cols-3 gap-1 rounded-md border p-1">
                  {(
                    [
                      ["typed", "Manuscrite"],
                      ["draw", "Dessiner"],
                      ["upload", "Importer"],
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
                  <Label className="text-xs">Nom (signature)</Label>
                  <Input
                    value={content.signature ?? ""}
                    onChange={(e) => updateContent("signature", e.target.value)}
                    placeholder="Jean Martin"
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
                          alt="Signature"
                          className="h-12 rounded border bg-white object-contain p-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => updateContent("signatureImage", "")}
                        >
                          Retirer
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
            aria-label="Redimensionner les panneaux"
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

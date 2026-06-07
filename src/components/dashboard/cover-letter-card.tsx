"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { AnimatedCard } from "@/components/ui/motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { triggerBlobDownload } from "@/lib/utils";

interface CoverLetterCardProps {
  coverLetter: {
    id: string;
    title: string;
    language: string;
    updatedAt: string;
  };
  onDelete: (id: string) => void;
  onDuplicate?: () => void;
}

export function CoverLetterCard({
  coverLetter,
  onDelete,
  onDuplicate,
}: CoverLetterCardProps) {
  const router = useRouter();
  const { authFetch } = useAuth();

  async function handleDuplicate() {
    try {
      const getRes = await authFetch(`/api/cover-letters/${coverLetter.id}`);
      if (!getRes.ok) throw new Error();
      const { coverLetter: full } = await getRes.json();
      const res = await authFetch("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${full.title} (copie)`,
          language: full.language,
          content: full.content,
          style: full.style,
          resumeId: full.resumeId,
        }),
      });
      if (res.ok) {
        toast.success("Lettre dupliquée !");
        onDuplicate?.();
      }
    } catch {
      toast.error("Erreur lors de la duplication");
    }
  }

  async function handleExport(format: string) {
    try {
      const res = await authFetch(
        `/api/cover-letters/${coverLetter.id}/export?format=${format}`,
      );
      if (!res.ok) {
        toast.error(`Erreur lors de l'export ${format.toUpperCase()}`);
        return;
      }
      const blob = await res.blob();
      const ext =
        format === "pdf" ? "pdf" : format === "docx" ? "docx" : "html";
      triggerBlobDownload(blob, `${coverLetter.title}.${ext}`);
      toast.success(`${format.toUpperCase()} téléchargé !`);
    } catch {
      toast.error(`Erreur lors de l'export ${format.toUpperCase()}`);
    }
  }

  async function handleDelete() {
    try {
      const res = await authFetch(`/api/cover-letters/${coverLetter.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Lettre supprimée");
        onDelete(coverLetter.id);
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  return (
    <AnimatedCard
      className="glass-card p-5 flex flex-col gap-3"
      style={{ cursor: "default" } as React.CSSProperties}
    >
      <div className="flex items-start justify-between">
        <h3
          className="text-base font-bold line-clamp-1 flex-1 mr-2"
          style={{
            color: "var(--fg)",
            fontFamily: "var(--font-outfit), Outfit, sans-serif",
          }}
        >
          {coverLetter.title}
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-xl transition-all hover:scale-105 cursor-pointer"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--fg-muted)",
            }}
            aria-label="Actions"
          >
            ···
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/cover-letter/${coverLetter.id}`)}
            >
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              Exporter PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("docx")}>
              Exporter DOCX
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("html")}>
              Exporter HTML
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-lg"
          style={{
            background: "rgba(116, 185, 255, 0.12)",
            color: "var(--accent-blue)",
            border: "1px solid rgba(116, 185, 255, 0.2)",
          }}
        >
          {coverLetter.language.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
          Modifié le{" "}
          {new Date(coverLetter.updatedAt).toLocaleDateString("fr-FR")}
        </span>
        <MagneticButton strength={0.25} padding={12}>
          <button
            className="btn-gradient text-xs"
            style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }}
            onClick={() => router.push(`/cover-letter/${coverLetter.id}`)}
          >
            Éditer
          </button>
        </MagneticButton>
      </div>
    </AnimatedCard>
  );
}

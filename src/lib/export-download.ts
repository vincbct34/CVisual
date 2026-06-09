import { triggerBlobDownload, safeFilename } from "./utils";

type AuthFetch = (url: string, options?: RequestInit) => Promise<Response>;

/** Thrown when the export endpoint replies 429 — lets callers show the
 *  server's throttle message instead of a generic export error. */
export class RateLimitError extends Error {}

const FORMAT_EXT: Record<string, string> = {
  pdf: "pdf",
  docx: "docx",
  html: "html",
  json: "json",
};

/**
 * Fetches a resource export and saves it to disk. Shared by the resume editor,
 * cover-letter editor, and cover-letter card (previously three copies of the
 * same fetch → blob → download dance). Throws on a non-OK response so the caller
 * owns its own success/error toast.
 *
 * @param basePath e.g. `/api/cv/${id}/export` or `/api/cover-letters/${id}/export`
 * @param title    document title used for the filename (falls back to `fallback`)
 */
export async function downloadExport(
  authFetch: AuthFetch,
  basePath: string,
  format: string,
  title: string,
  fallback: string,
): Promise<void> {
  const res = await authFetch(`${basePath}?format=${format}`);
  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    throw new RateLimitError(
      data.error ?? "Trop d'exports. Réessayez dans un instant.",
    );
  }
  if (!res.ok) throw new Error(`Export ${format} failed`);
  const blob = await res.blob();
  const ext = FORMAT_EXT[format] ?? "pdf";
  triggerBlobDownload(blob, `${safeFilename(title || fallback)}.${ext}`);
}

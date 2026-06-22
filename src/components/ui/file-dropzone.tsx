"use client";

import { useRef, useState } from "react";
import { useT } from "@/components/i18n/language-provider";

interface FileDropzoneProps {
  /** Accept attribute, e.g. ".json" or "application/pdf,.pdf" */
  accept: string;
  onFile: (file: File) => void;
  loading?: boolean;
  error?: boolean;
  disabled?: boolean;
  /** Title shown while `loading` */
  loadingTitle?: string;
  /** Optional second line under the loading title (e.g. file name) */
  loadingSubtext?: string;
  /** Idle prompt */
  idleTitle: string;
  idleHint?: string;
}

function Spinner() {
  return (
    <svg
      className="animate-spin w-7 h-7"
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: "var(--accent-strong)" }}
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
  );
}

function UploadIcon() {
  return (
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
  );
}

/**
 * Editorial drag-and-drop file picker. Single source for the upload zone shared
 * by the JSON-import and LinkedIn-import dialogs (previously two near-identical
 * copies of the drag state + chrome). Owns drag state + the hidden input; the
 * caller supplies `onFile` and labels.
 */
export function FileDropzone({
  accept,
  onFile,
  loading = false,
  error = false,
  disabled = false,
  loadingTitle,
  loadingSubtext,
  idleTitle,
  idleHint,
}: FileDropzoneProps) {
  const t = useT();
  const resolvedLoadingTitle = loadingTitle ?? t("common.loading");
  const resolvedIdleHint = idleHint ?? t("ui.dropzoneHint");
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const blocked = loading || disabled;

  function pick(file?: File | null) {
    if (file && !blocked) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!blocked) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!blocked) pick(e.dataTransfer.files[0]);
      }}
      onClick={() => !blocked && fileRef.current?.click()}
      className="p-8 text-center transition-all"
      style={{
        border: `2px dashed ${isDragging ? "var(--accent-strong)" : error ? "var(--destructive)" : "var(--input-border)"}`,
        borderRadius: "var(--radius)",
        background: isDragging ? "var(--accent-soft)" : "var(--input-bg)",
        cursor: blocked ? "default" : "pointer",
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              {resolvedLoadingTitle}
            </p>
            {loadingSubtext && (
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--fg-muted)" }}
              >
                {loadingSubtext}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <UploadIcon />
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: "var(--fg)" }}
          >
            {idleTitle}
          </p>
          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
            {resolvedIdleHint}
          </p>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAI } from "@/hooks/use-ai";
import { AISettingsDialog } from "./ai-settings-dialog";

/**
 * Bannière contextuelle affichée lorsqu'aucune clé IA n'est configurée.
 * À placer dans les panneaux qui contiennent des features IA.
 */
export function AISetupBanner() {
  const { hasKey } = useAI();
  const [open, setOpen] = useState(false);

  if (hasKey) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-opacity hover:opacity-80 cursor-pointer"
        style={{
          background: "var(--accent-soft)",
          border: "1px solid var(--accent)",
          borderRadius: "var(--radius)",
        }}
      >
        <span style={{ fontSize: "15px", flexShrink: 0 }}>✦</span>
        <div className="min-w-0">
          <p
            className="text-xs font-semibold"
            style={{ color: "var(--accent-violet)" }}
          >
            Fonctionnalités IA désactivées
          </p>
          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
            Configurez une clé API pour améliorer votre contenu, générer des
            résumés et scorer votre ATS.{" "}
            <span
              style={{
                color: "var(--accent-violet)",
                textDecoration: "underline",
              }}
            >
              Configurer →
            </span>
          </p>
        </div>
      </button>

      <AISettingsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

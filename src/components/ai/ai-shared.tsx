"use client";

import { toast } from "sonner";

/** The shared "AI" sparkle glyph used on every AI action control. */
export function SparklesIcon({
  size = 12,
  dim = false,
}: {
  size?: number;
  dim?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={dim ? { opacity: 0.5 } : undefined}
    >
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  );
}

/**
 * Standard "no API key" warning toast with a shortcut to open AI settings.
 * `action` completes the sentence "…pour <action>." (e.g. "améliorer votre
 * contenu", "générer un résumé").
 */
export function notifyAINotConfigured(onConfigure: () => void, action: string) {
  toast.warning("Fonctionnalité IA non configurée", {
    description: `Ajoutez une clé API dans vos paramètres pour ${action}.`,
    action: { label: "Configurer", onClick: onConfigure },
  });
}

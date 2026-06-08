"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  // The banner is fixed bottom-right; on the scrollable editor/cover-letter
  // forms it floats over inputs and section controls. And on public/shared CV
  // links it's recruiter-facing noise that can overlap the document. Suppress
  // it on all of these.
  const onSuppressedRoute =
    pathname?.startsWith("/editor/") ||
    pathname?.startsWith("/cover-letter/") ||
    pathname?.startsWith("/public/") ||
    pathname?.startsWith("/share/");

  useEffect(() => {
    if (localStorage.getItem("pwa-install-dismissed")) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed || onSuppressedRoute) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  return (
    <div className="pwa-banner fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 p-4 flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
          Installer CVisual
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
          Accédez à l&apos;app directement depuis votre écran d&apos;accueil
        </p>
        <button
          onClick={handleInstall}
          className="btn-gradient mt-2 text-xs"
          style={{
            padding: "0.4rem 0.85rem",
            borderRadius: "var(--radius)",
            gap: "0.35rem",
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Installer
        </button>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Fermer"
        className="p-1 rounded-lg transition-colors"
        style={{ color: "var(--fg-muted)" }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

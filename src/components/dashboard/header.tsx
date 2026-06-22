"use client";

import { useState } from "react";
import { useLocalizedRouter } from "@/components/i18n/link";
import { useT } from "@/components/i18n/language-provider";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/use-auth";
import { useAI } from "@/hooks/use-ai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AISettingsDialog } from "@/components/ai/ai-settings-dialog";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { hasKey } = useAI();
  const router = useLocalizedRouter();
  const t = useT();
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="glass-toolbar sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Logo
          href="/dashboard"
          size={22}
          className="hover:opacity-80 transition-opacity"
        />

        <div className="flex items-center gap-2">
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="btn-chip">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "var(--ink)" }}
              >
                {initials}
              </span>
              <span className="hidden max-w-[10rem] truncate sm:inline">
                {user?.name}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-auto min-w-56 max-w-[calc(100vw-1rem)]"
            >
              <DropdownMenuItem
                className="text-muted-foreground text-xs break-all"
                disabled
              >
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAiSettingsOpen(true)}>
                <span
                  className="w-2 h-2 rounded-full mr-2"
                  style={{
                    background: hasKey
                      ? "var(--accent-mint)"
                      : "var(--fg-muted)",
                  }}
                />
                {t("header.aiSettings")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/settings/account")}
              >
                {t("header.myAccount")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                {t("header.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AISettingsDialog
        open={aiSettingsOpen}
        onOpenChange={setAiSettingsOpen}
      />
    </header>
  );
}

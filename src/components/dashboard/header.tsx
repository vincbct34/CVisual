"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { useAI } from "@/hooks/use-ai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AISettingsDialog } from "@/components/ai/ai-settings-dialog";
import { Moon, Sun } from "lucide-react";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { hasKey } = useAI();
  const { resolvedTheme, setTheme } = useTheme();
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
    <header
      className="border-b"
      style={{
        background: "var(--glass)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/dashboard"
          aria-label="Retour au tableau de bord"
          className="transition-opacity hover:opacity-80"
        >
          <h1
            className="text-xl font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            <span className="text-gradient">CV</span>
            <span style={{ color: "var(--fg)" }}>Visual</span>
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="Basculer le thème"
            className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all hover:scale-105 cursor-pointer"
            style={{
              background: "var(--card-bg)",
              backdropFilter: "blur(12px)",
              borderColor: "var(--card-border)",
              color: "var(--fg-muted)",
            }}
          >
            {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all hover:scale-[1.02] cursor-pointer"
              style={{
                background: "var(--card-bg)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--card-border)",
                color: "var(--fg)",
              }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #ff6b6b 0%, #a29bfe 50%, #74b9ff 100%)",
                }}
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
                  style={{ background: hasKey ? "#22c55e" : "var(--fg-muted)" }}
                />
                Paramètres IA
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                Se déconnecter
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

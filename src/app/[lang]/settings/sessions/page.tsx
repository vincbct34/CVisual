"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocale, useT } from "@/components/i18n/language-provider";
import { DashboardHeader } from "@/components/dashboard/header";
import { toast } from "sonner";

interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
}

export default function SessionsPage() {
  const { authFetch } = useAuth();
  const t = useT();
  const locale = useLocale();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await authFetch("/api/auth/sessions");
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions);
        }
      } catch {
        toast.error(t("sessions.loadError"));
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [authFetch, t]);

  async function revokeSession(id: string) {
    setRevoking(id);
    try {
      const res = await authFetch(`/api/auth/sessions?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        toast.success(t("sessions.revoked"));
      } else {
        toast.error(t("sessions.revokeError"));
      }
    } catch {
      toast.error(t("sessions.revokeError"));
    } finally {
      setRevoking(null);
    }
  }

  function fmt(date: string) {
    return new Date(date).toLocaleString(locale === "en" ? "en-US" : "fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      <DashboardHeader />
      <main className="container mx-auto flex-1 px-4 py-8 max-w-2xl">
        <h1
          className="font-heading text-2xl mb-1"
          style={{ color: "var(--fg)" }}
        >
          {t("sessions.title")}
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--fg-muted)" }}>
          {t("sessions.subtitle")}
        </p>

        {loading && (
          <p style={{ color: "var(--fg-muted)" }}>{t("common.loading")}</p>
        )}
        {!loading && sessions.length === 0 && (
          <p style={{ color: "var(--fg-muted)" }}>{t("sessions.empty")}</p>
        )}

        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div
              key={s.id}
              className="glass-card flex items-center justify-between p-4"
              style={{ cursor: "default" }}
            >
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--fg)" }}
                >
                  {t("sessions.session")}{" "}
                  {i === 0 && (
                    <span
                      className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--accent-strong)",
                      }}
                    >
                      {t("sessions.current")}
                    </span>
                  )}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--fg-muted)" }}
                >
                  {t("sessions.created", { date: fmt(s.createdAt) })}
                </p>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  {t("sessions.expires", { date: fmt(s.expiresAt) })}
                </p>
              </div>
              <button
                className="btn-danger text-xs"
                style={{
                  padding: "0.4rem 0.9rem",
                  borderRadius: "var(--radius)",
                }}
                disabled={revoking === s.id}
                onClick={() => revokeSession(s.id)}
              >
                {revoking === s.id ? "..." : t("sessions.revoke")}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

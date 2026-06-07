"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { toast } from "sonner";

interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
}

export default function SessionsPage() {
  const { authFetch } = useAuth();
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
        toast.error("Erreur de chargement des sessions");
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [authFetch]);

  async function revokeSession(id: string) {
    setRevoking(id);
    try {
      const res = await authFetch(`/api/auth/sessions?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        toast.success("Session révoquée");
      } else {
        toast.error("Erreur lors de la révocation");
      }
    } catch {
      toast.error("Erreur lors de la révocation");
    } finally {
      setRevoking(null);
    }
  }

  function fmt(date: string) {
    return new Date(date).toLocaleString("fr-FR", {
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
          Sessions actives
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--fg-muted)" }}>
          Chaque session correspond à un appareil ou navigateur connecté.
          Révoquez les sessions inconnues.
        </p>

        {loading && <p style={{ color: "var(--fg-muted)" }}>Chargement...</p>}
        {!loading && sessions.length === 0 && (
          <p style={{ color: "var(--fg-muted)" }}>Aucune session active.</p>
        )}

        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div
              key={s.id}
              className="glass-card flex items-center justify-between p-4 rounded-xl"
              style={{ cursor: "default" }}
            >
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--fg)" }}
                >
                  Session{" "}
                  {i === 0 && (
                    <span
                      className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(162,155,254,0.15)",
                        color: "var(--accent-violet)",
                      }}
                    >
                      actuelle
                    </span>
                  )}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--fg-muted)" }}
                >
                  Créée le {fmt(s.createdAt)}
                </p>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  Expire le {fmt(s.expiresAt)}
                </p>
              </div>
              <button
                className="btn-danger text-xs"
                style={{ padding: "0.4rem 0.9rem", borderRadius: "0.6rem" }}
                disabled={revoking === s.id}
                onClick={() => revokeSession(s.id)}
              >
                {revoking === s.id ? "..." : "Révoquer"}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

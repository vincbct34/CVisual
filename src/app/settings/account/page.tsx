"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { toast } from "sonner";

export default function AccountPage() {
  const { user, authFetch, updateUser, logout } = useAuth();

  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Sync the form when the authenticated user loads/changes (render-time pattern)
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);
  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id);
    setName(user.name);
    setEmail(user.email);
  }

  const profileChanged =
    user && (name.trim() !== user.name || email.trim() !== user.email);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profileChanged) return;
    setSavingProfile(true);
    try {
      const res = await authFetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        updateUser({ name: data.user.name, email: data.user.email });
        toast.success("Profil mis à jour");
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingPassword(true);
    try {
      const res = await authFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        toast.success("Mot de passe modifié");
      } else {
        toast.error(data.error || "Erreur lors de la modification");
      }
    } catch {
      toast.error("Erreur lors de la modification");
    } finally {
      setSavingPassword(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const res = await authFetch("/api/auth/me", { method: "DELETE" });
      if (res.ok) {
        toast.success("Compte supprimé");
        await logout();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la suppression");
        setDeleting(false);
      }
    } catch {
      toast.error("Erreur lors de la suppression");
      setDeleting(false);
    }
  }

  const inputStyle = {
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    color: "var(--fg)",
  };

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
          Mon compte
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--fg-muted)" }}>
          Gérez vos informations personnelles, votre mot de passe et vos
          sessions.
        </p>

        {/* Profile */}
        <section className="glass-card p-6 mb-6">
          <h2
            className="font-heading text-lg mb-4"
            style={{ color: "var(--fg)" }}
          >
            Profil
          </h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-sm font-semibold"
                style={{ color: "var(--fg)" }}
              >
                Nom
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-semibold"
                style={{ color: "var(--fg)" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              className="btn-gradient"
              disabled={!profileChanged || savingProfile}
              style={{ opacity: !profileChanged || savingProfile ? 0.6 : 1 }}
            >
              {savingProfile ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </section>

        {/* Password */}
        <section className="glass-card p-6 mb-6">
          <h2
            className="font-heading text-lg mb-4"
            style={{ color: "var(--fg)" }}
          >
            Mot de passe
          </h2>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="current-password"
                className="text-sm font-semibold"
                style={{ color: "var(--fg)" }}
              >
                Mot de passe actuel
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="text-sm font-semibold"
                style={{ color: "var(--fg)" }}
              >
                Nouveau mot de passe
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              />
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                Au moins 8 caractères. Vos autres sessions seront déconnectées.
              </p>
            </div>
            <button
              type="submit"
              className="btn-gradient"
              disabled={
                savingPassword || !currentPassword || newPassword.length < 8
              }
              style={{
                opacity:
                  savingPassword || !currentPassword || newPassword.length < 8
                    ? 0.6
                    : 1,
              }}
            >
              {savingPassword ? "Modification..." : "Modifier le mot de passe"}
            </button>
          </form>
        </section>

        {/* Sessions */}
        <section className="glass-card p-6 mb-6">
          <h2
            className="font-heading text-lg mb-2"
            style={{ color: "var(--fg)" }}
          >
            Sessions
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--fg-muted)" }}>
            Consultez et révoquez les appareils connectés à votre compte.
          </p>
          <Link href="/settings/sessions" className="btn-ghost inline-block">
            Gérer les sessions
          </Link>
        </section>

        {/* Danger zone */}
        <section
          className="glass-card p-6"
          style={{ borderColor: "var(--destructive)" }}
        >
          <h2
            className="font-heading text-lg mb-2"
            style={{ color: "var(--destructive)" }}
          >
            Supprimer le compte
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--fg-muted)" }}>
            Cette action est irréversible. Tous vos CV, lettres de motivation et
            données seront définitivement supprimés. Saisissez votre email
            <strong> {user?.email} </strong> pour confirmer.
          </p>
          <input
            type="email"
            value={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.value)}
            placeholder="Votre email"
            autoComplete="off"
            className="w-full rounded px-3 py-2 text-sm mb-4"
            style={inputStyle}
          />
          <button
            className="btn-danger"
            disabled={deleting || confirmDelete.trim() !== user?.email}
            onClick={deleteAccount}
            style={{
              opacity:
                deleting || confirmDelete.trim() !== user?.email ? 0.6 : 1,
            }}
          >
            {deleting ? "Suppression..." : "Supprimer définitivement"}
          </button>
        </section>
      </main>
    </div>
  );
}

"use client";

import { useState, use, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AuthCard } from "../auth-card";

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");
      toast.success("Mot de passe réinitialisé avec succès !");
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la réinitialisation",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-gradient w-full mt-2"
        style={{ opacity: isSubmitting ? 0.7 : 1 }}
      >
        {isSubmitting ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
      </button>
    </form>
  );
}

function ResetPasswordContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = use(searchParams);
  const token = params.token;

  if (!token) {
    return (
      <div className="space-y-4">
        <p
          className="text-sm text-center rounded-xl p-4"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            color: "var(--destructive)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          Lien de réinitialisation invalide ou manquant.
        </p>
        <Link href="/forgot-password">
          <button className="btn-gradient w-full">
            Demander un nouveau lien
          </button>
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default function ResetPasswordPage({ searchParams }: Props) {
  return (
    <AuthCard>
      <div className="text-center mb-8">
        <h1
          className="font-heading text-3xl mb-1"
          style={{ color: "var(--fg)" }}
        >
          Nouveau mot de passe
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
          Créez un nouveau mot de passe pour votre compte
        </p>
      </div>

      <Suspense
        fallback={
          <p style={{ color: "var(--fg-muted)", textAlign: "center" }}>
            Chargement...
          </p>
        }
      >
        <ResetPasswordContent searchParams={searchParams} />
      </Suspense>

      <p
        className="text-center mt-6 text-sm"
        style={{ color: "var(--fg-muted)" }}
      >
        <Link
          href="/login"
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{ color: "var(--accent-violet)" }}
        >
          ← Retour à la connexion
        </Link>
      </p>
    </AuthCard>
  );
}

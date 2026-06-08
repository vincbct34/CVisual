"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AuthCard } from "../auth-card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Une erreur est survenue.");
      setIsSuccess(true);
      toast.success("Email envoyé avec succès !");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi de l'email",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard>
      <div className="text-center mb-8">
        <h1
          className="font-heading text-3xl mb-1"
          style={{ color: "var(--fg)" }}
        >
          Mot de passe oublié
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
          {isSuccess
            ? "Vérifiez votre boîte de réception"
            : "Entrez votre email pour recevoir un lien de réinitialisation"}
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-5">
          <p
            className="text-sm text-center rounded p-4"
            style={{
              background: "var(--success-soft)",
              color: "var(--accent-mint)",
              border: "1px solid var(--success)",
            }}
          >
            Si un compte est associé à <strong>{email}</strong>, un email
            contenant un lien de réinitialisation vient d&apos;être envoyé.
          </p>
          <Link href="/login">
            <button className="btn-gradient w-full mt-2">
              Retour à la connexion
            </button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gradient w-full"
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      )}

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

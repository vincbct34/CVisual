"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AuthCard } from "../auth-card";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, name);
      toast.success("Compte créé avec succès !");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur d'inscription",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard outerClassName="px-4 py-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1
          className="text-3xl font-extrabold tracking-tight mb-1"
          style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
        >
          <span className="text-gradient">CV</span>
          <span style={{ color: "var(--fg)" }}>Visual</span>
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
          Créez votre compte
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" style={{ color: "var(--fg)", fontWeight: 600 }}>
            Nom complet
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Jean Dupont"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--fg)",
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            style={{ color: "var(--fg)", fontWeight: 600 }}
          >
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--fg)",
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            style={{ color: "var(--fg)", fontWeight: 600 }}
          >
            Mot de passe
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="8 caractères minimum"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--fg)",
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            style={{ color: "var(--fg)", fontWeight: 600 }}
          >
            Confirmer le mot de passe
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--fg)",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-gradient mt-2"
          style={{ opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Création...
            </span>
          ) : (
            "Créer un compte"
          )}
        </button>
      </form>

      <p
        className="text-center mt-6 text-sm"
        style={{ color: "var(--fg-muted)" }}
      >
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{ color: "var(--color-accent-violet)" }}
        >
          Se connecter
        </Link>
      </p>
    </AuthCard>
  );
}

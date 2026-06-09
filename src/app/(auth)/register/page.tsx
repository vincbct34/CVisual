"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";
import { AuthCard } from "../auth-card";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        <div className="mb-1 flex justify-center">
          <Logo href={"/"} size={32} />
        </div>
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="pr-9"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--fg)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
              style={{ color: "var(--fg-muted)" }}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            style={{ color: "var(--fg)", fontWeight: 600 }}
          >
            Confirmer le mot de passe
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="pr-9"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--fg)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={
                showConfirmPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
              style={{ color: "var(--fg-muted)" }}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
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

        <p className="text-center text-xs" style={{ color: "var(--fg-muted)" }}>
          En créant un compte, vous acceptez nos{" "}
          <Link
            href="/cgu"
            className="underline hover:opacity-80 transition-opacity"
          >
            CGU
          </Link>{" "}
          et notre{" "}
          <Link
            href="/confidentialite"
            className="underline hover:opacity-80 transition-opacity"
          >
            Politique de confidentialité
          </Link>
          .
        </p>
      </form>

      <p
        className="text-center mt-6 text-sm"
        style={{ color: "var(--fg-muted)" }}
      >
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{ color: "var(--accent-violet)" }}
        >
          Se connecter
        </Link>
      </p>
    </AuthCard>
  );
}

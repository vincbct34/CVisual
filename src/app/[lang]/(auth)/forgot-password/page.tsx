"use client";

import { useState } from "react";
import { Link } from "@/components/i18n/link";
import { useT } from "@/components/i18n/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AuthCard } from "../auth-card";

export default function ForgotPasswordPage() {
  const t = useT();
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("auth.genericError"));
      }
      setIsSuccess(true);
      toast.success(t("auth.forgotSentToast"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("auth.forgotErrorToast"),
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
          {t("auth.forgotTitle")}
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
          {isSuccess
            ? t("auth.forgotSubtitleSuccess")
            : t("auth.forgotSubtitle")}
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
            {t("auth.forgotSuccessMsg", { email })}
          </p>
          <Link href="/login">
            <button className="btn-gradient w-full mt-2">
              {t("auth.backToLogin")}
            </button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
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
            {isSubmitting ? t("auth.forgotSubmitting") : t("auth.forgotSubmit")}
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
          ← {t("auth.backToLogin")}
        </Link>
      </p>
    </AuthCard>
  );
}

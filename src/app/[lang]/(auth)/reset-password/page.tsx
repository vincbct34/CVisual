"use client";

import { useState, use, Suspense } from "react";
import { Link, useLocalizedRouter } from "@/components/i18n/link";
import { useT } from "@/components/i18n/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AuthCard } from "../auth-card";

function ResetPasswordForm({ token }: { token: string }) {
  const router = useLocalizedRouter();
  const t = useT();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t("auth.pwMismatch"));
      return;
    }
    if (password.length < 8) {
      toast.error(t("auth.pwTooShort"));
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
      if (!res.ok) throw new Error(data.error || t("auth.genericError"));
      toast.success(t("auth.resetSuccess"));
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("auth.resetError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("auth.resetNewPassword")}</Label>
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
        <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
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
        {isSubmitting ? t("auth.resetSubmitting") : t("auth.resetSubmit")}
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
  const t = useT();

  if (!token) {
    return (
      <div className="space-y-4">
        <p
          className="text-sm text-center rounded p-4"
          style={{
            background: "var(--destructive-soft)",
            color: "var(--destructive)",
            border: "1px solid var(--destructive)",
          }}
        >
          {t("auth.resetInvalidLink")}
        </p>
        <Link href="/forgot-password">
          <button className="btn-gradient w-full">
            {t("auth.resetRequestNew")}
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
  return <ResetPasswordPageInner searchParams={searchParams} />;
}

function ResetPasswordPageInner({ searchParams }: Props) {
  const t = useT();
  return (
    <AuthCard>
      <div className="text-center mb-8">
        <h1
          className="font-heading text-3xl mb-1"
          style={{ color: "var(--fg)" }}
        >
          {t("auth.resetTitle")}
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
          {t("auth.resetSubtitle")}
        </p>
      </div>

      <Suspense
        fallback={
          <p style={{ color: "var(--fg-muted)", textAlign: "center" }}>
            {t("common.loading")}
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
          ← {t("auth.backToLogin")}
        </Link>
      </p>
    </AuthCard>
  );
}

"use client";

import { Link } from "@/components/i18n/link";
import { useT } from "@/components/i18n/language-provider";
import { Arrow } from "@/components/landing/landing-shell";
import { useAuth } from "@/hooks/use-auth";

interface HomeCtaProps {
  /** Class for the primary (register / dashboard) button. */
  primaryClass: string;
  /** Class for the secondary (login) button. */
  secondaryClass: string;
  primaryLabel: string;
  secondaryLabel: string;
}

/**
 * Auth-aware home page call-to-action. Logged out → register + login;
 * logged in → a single button to the dashboard. Renders nothing while auth
 * is still resolving to avoid a logged-out → logged-in flash.
 */
export function HomeCta({
  primaryClass,
  secondaryClass,
  primaryLabel,
  secondaryLabel,
}: HomeCtaProps) {
  const { user, isLoading } = useAuth();
  const t = useT();

  if (isLoading) return null;

  if (user) {
    return (
      <Link className={primaryClass} href="/dashboard">
        {t("landing.goToSpace")} <Arrow />
      </Link>
    );
  }

  return (
    <>
      <Link className={primaryClass} href="/register">
        {primaryLabel} <Arrow />
      </Link>
      <Link className={secondaryClass} href="/login">
        {secondaryLabel}
      </Link>
    </>
  );
}

interface RegisterCtaProps {
  className: string;
  /** Button text shown to logged-out visitors. */
  label: string;
}

/**
 * Single auth-aware CTA for the marketing pages: logged out → register with the
 * given label; logged in → a link to the dashboard. Nothing while resolving.
 */
export function RegisterCta({ className, label }: RegisterCtaProps) {
  const { user, isLoading } = useAuth();
  const t = useT();

  if (isLoading) return null;

  return (
    <Link className={className} href={user ? "/dashboard" : "/register"}>
      {user ? t("landing.goToSpace") : label} <Arrow />
    </Link>
  );
}

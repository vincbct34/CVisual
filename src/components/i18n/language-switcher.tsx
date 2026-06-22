"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "./language-provider";
import { stripLocale } from "./link";
import { locales, localeNames } from "@/lib/i18n/config";

/**
 * Compact FR/EN toggle. Switches the leading locale segment of the current path
 * and persists the choice via the `locale` cookie (set on navigation by the
 * LanguageProvider effect).
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useLocale();

  const switchTo = (locale: string) => {
    if (locale === current) return;
    const rest = stripLocale(pathname ?? "/");
    router.push(`/${locale}${rest === "/" ? "" : rest}`);
  };

  return (
    <div
      className={`lang-switch ${className}`}
      role="group"
      aria-label="Language"
    >
      {locales.map((locale, i) => (
        <span
          key={locale}
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          {i > 0 && <span className="lang-sep">/</span>}
          <button
            type="button"
            onClick={() => switchTo(locale)}
            aria-current={locale === current}
            className="lang-opt"
            style={{
              fontWeight: locale === current ? 700 : 400,
              opacity: locale === current ? 1 : 0.55,
              textTransform: "uppercase",
              fontSize: 12,
              letterSpacing: "0.04em",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 4px",
              color: "inherit",
              fontFamily: "var(--mono)",
            }}
            title={localeNames[locale]}
          >
            {locale}
          </button>
        </span>
      ))}
    </div>
  );
}

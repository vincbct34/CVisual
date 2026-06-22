"use client";

import { Link } from "@/components/i18n/link";
import { useT } from "@/components/i18n/language-provider";
import { Logo } from "@/components/landing/landing-shell";
// Footer styles live in landing.css (all `.landing`-scoped). Importing here
// loads them on every page, since the footer is global but the marketing
// pages were previously the only importers of this stylesheet.
import "@/app/landing.css";

/**
 * Global site footer, rendered by the [lang] layout so it always has an active
 * locale. The headless `/render/*` targets live outside [lang] and never mount
 * it, so export chrome can't leak.
 */
export function SiteFooter() {
  const t = useT();

  return (
    <div className="landing">
      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <Logo />
              <div className="foot-tag">{t("footer.tagline")}</div>
              <a
                className="foot-bmc"
                href="https://www.buymeacoffee.com/404factory"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=404factory&button_colour=a54b24&font_colour=ffffff&outline_colour=ffffff&coffee_colour=FFDD00"
                  alt={t("footer.buyMeCoffee")}
                  height={48}
                />
              </a>
            </div>
            <div className="foot-links">
              <Link href="/modeles">{t("nav.templates")}</Link>
              <Link href="/export">{t("nav.export")}</Link>
              <Link href="/ia">{t("nav.ai")}</Link>
              <Link href="/login">{t("nav.login")}</Link>
              <Link href="/register">{t("nav.register")}</Link>
            </div>
          </div>
          <div className="foot-copy">
            <span>© {new Date().getFullYear()} CVisual</span>
            <div className="foot-legal">
              <Link href="/mentions-legales">{t("footer.legalMentions")}</Link>
              <Link href="/confidentialite">{t("footer.privacy")}</Link>
              <Link href="/cgu">{t("footer.cgu")}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

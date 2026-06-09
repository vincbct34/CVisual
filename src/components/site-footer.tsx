"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/landing/landing-shell";
// Footer styles live in landing.css (all `.landing`-scoped). Importing here
// loads them on every page, since the footer is global but the marketing
// pages were previously the only importers of this stylesheet.
import "@/app/landing.css";

/**
 * Global site footer, shown on every page. Wrapped in `.landing` so it reuses
 * the editorial footer styles from landing.css. Hidden on the headless
 * `/render/*` targets, which Puppeteer captures verbatim for PDF/HTML export —
 * any chrome there would leak into the exported document.
 */
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/render")) return null;

  return (
    <div className="landing">
      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <Logo />
              <div className="foot-tag">Le CV, repensé.</div>
              <a
                className="foot-bmc"
                href="https://www.buymeacoffee.com/404factory"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=404factory&button_colour=a54b24&font_colour=ffffff&outline_colour=ffffff&coffee_colour=FFDD00"
                  alt="Offrez-moi un café"
                  height={48}
                />
              </a>
            </div>
            <div className="foot-links">
              <Link href="/modeles">Modèles</Link>
              <Link href="/export">Export</Link>
              <Link href="/ia">IA</Link>
              <Link href="/login">Connexion</Link>
              <Link href="/register">Créer un compte</Link>
            </div>
          </div>
          <div className="foot-copy">
            <span>© {new Date().getFullYear()} CVisual</span>
            <div className="foot-legal">
              <Link href="/mentions-legales">Mentions légales</Link>
              <Link href="/confidentialite">Confidentialité</Link>
              <Link href="/cgu">CGU</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/ui/logo";

const BADGES = [
  "5 templates",
  "Export PDF / DOCX",
  "Multi-langue",
  "ATS-friendly",
  "IA intégrée",
];

export function Arrow({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link className="logo" href="/" style={{ alignItems: "center", gap: 9 }}>
      <LogoMark size={27} />
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 3 }}>
        CVisual<span className="reg">®</span>
      </span>
    </Link>
  );
}

function TickerItem() {
  // Repeat badges so one copy comfortably exceeds the viewport width, keeping
  // gaps tight while min-width:100% still guarantees a seamless wrap.
  const items = [...BADGES, ...BADGES, ...BADGES];
  return (
    <div className="ticker-item">
      {items.map((b, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
          <span className="sep">◆</span>
          <span className="txt">{b}</span>
        </span>
      ))}
    </div>
  );
}

function Masthead() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`mast${scrolled ? " scrolled" : ""}`}>
      <div className="wrap mast-inner">
        <Logo />
        <nav className="mast-right">
          <Link className="mast-link hide-sm" href="/modeles">
            Modèles
          </Link>
          <Link className="mast-link" href="/login">
            Connexion
          </Link>
          <Link className="btn btn-ink btn-sm" href="/register">
            Créer un compte
          </Link>
        </nav>
      </div>
    </header>
  );
}

interface LandingShellProps {
  children: React.ReactNode;
  /** Hide the scrolling badge ticker (kept on the home page only). */
  ticker?: boolean;
}

/**
 * Shared chrome for the marketing pages (home, /modeles, /export, /ia):
 * sticky masthead, optional ticker, and the reveal-on-scroll observer that
 * animates any `.reveal` element rendered by the page. The footer is global
 * (mounted in the root layout via `SiteFooter`).
 */
export function LandingShell({ children, ticker = false }: LandingShellProps) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(".landing .reveal")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="landing">
      <Masthead />
      {ticker && (
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            <TickerItem />
            <TickerItem />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

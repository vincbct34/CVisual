"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  StaggerList,
  StaggerItem,
  StaggerListScroll,
} from "@/components/ui/motion";
import { MagneticButton } from "@/components/ui/magnetic-button";

export default function HomePage() {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Header ── */}
      <header className="glass-toolbar sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-5xl">
          <motion.h1
            className="font-heading text-xl"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-gradient">CV</span>
            <span style={{ color: "var(--fg)" }}>Visual</span>
          </motion.h1>

          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <MagneticButton>
              <Link href="/login">
                <button
                  className="btn-ghost"
                  style={{ padding: "0.45rem 1.1rem", fontSize: "0.875rem" }}
                >
                  Connexion
                </button>
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link href="/register">
                <button
                  className="btn-gradient"
                  style={{ padding: "0.45rem 1.1rem", fontSize: "0.875rem" }}
                >
                  Créer un compte
                </button>
              </Link>
            </MagneticButton>
          </motion.div>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <StaggerList slow className="text-center max-w-3xl mx-auto space-y-8">
          {/* Badge */}
          <StaggerItem>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{
                border: "1px solid rgba(162, 155, 254, 0.25)",
                background: "rgba(162, 155, 254, 0.08)",
                color: "var(--accent-violet)",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: "var(--accent-violet)" }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: "var(--accent-violet)" }}
                />
              </span>
              Disponible gratuitement
            </div>
          </StaggerItem>

          {/* Headline */}
          <StaggerItem>
            <h2
              className="font-heading text-5xl sm:text-6xl lg:text-7xl leading-tight"
              style={{ color: "var(--fg)" }}
            >
              Créez des <span className="text-gradient">CV professionnels</span>{" "}
              en quelques minutes
            </h2>
          </StaggerItem>

          {/* Subline */}
          <StaggerItem>
            <p
              className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto"
              style={{
                color: "var(--fg-muted)",
                fontFamily: "var(--font-inter), Inter, sans-serif",
              }}
            >
              ATS-friendly, personnalisables, exportables en PDF. Choisissez
              parmi nos templates et construisez le CV qui vous ressemble.
            </p>
          </StaggerItem>

          {/* CTAs */}
          <StaggerItem>
            <div className="flex gap-4 justify-center flex-wrap">
              <MagneticButton>
                <Link href="/register">
                  <button
                    className="btn-gradient"
                    style={{
                      padding: "0.9rem 2.25rem",
                      fontSize: "1rem",
                      borderRadius: "1rem",
                    }}
                  >
                    Commencer gratuitement →
                  </button>
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link href="/login">
                  <button
                    className="btn-ghost"
                    style={{
                      padding: "0.9rem 2.25rem",
                      fontSize: "1rem",
                      borderRadius: "1rem",
                    }}
                  >
                    Se connecter
                  </button>
                </Link>
              </MagneticButton>
            </div>
          </StaggerItem>

          {/* Features row */}
          <StaggerItem>
            <div
              className="flex gap-6 justify-center flex-wrap text-sm pt-2"
              style={{ color: "var(--fg-muted)" }}
            >
              {[
                "5 templates",
                "Export PDF / DOCX",
                "Multi-langue",
                "ATS-friendly",
                "IA intégrée",
              ].map((feat) => (
                <span key={feat} className="flex items-center gap-1.5">
                  <span
                    style={{ color: "var(--accent-mint)", fontSize: "0.8rem" }}
                  >
                    ✓
                  </span>
                  {feat}
                </span>
              ))}
            </div>
          </StaggerItem>
        </StaggerList>
      </main>

      {/* ── Feature cards — scroll-triggered stagger ── */}
      <section className="container mx-auto px-4 pb-24 max-w-5xl">
        <StaggerListScroll className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "✦",
              iconBg: "rgba(162, 155, 254, 0.15)",
              title: "Templates pro",
              desc: "5 templates modernes optimisés pour les ATS et les recruteurs.",
            },
            {
              icon: "⬡",
              iconBg: "rgba(255, 107, 107, 0.12)",
              title: "Export multi-format",
              desc: "PDF haute qualité, DOCX Word, HTML. Prêt à envoyer en un clic.",
            },
            {
              icon: "◈",
              iconBg: "rgba(116, 185, 255, 0.12)",
              title: "IA embarquée",
              desc: "Améliorez votre contenu, traduisez en plusieurs langues, scorez votre ATS.",
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              className="glass-card p-6"
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              whileHover={{
                y: -8,
                scale: 1.02,
                boxShadow: "0 20px 40px -15px rgba(139,92,246,0.18)",
              }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 text-xl"
                style={{ background: card.iconBg }}
              >
                {card.icon}
              </div>
              <h3
                className="font-heading text-base mb-2"
                style={{ color: "var(--fg)", fontWeight: 700 }}
              >
                {card.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--fg-muted)" }}
              >
                {card.desc}
              </p>
            </motion.div>
          ))}
        </StaggerListScroll>
      </section>

      <footer
        className="text-center py-6 text-xs"
        style={{
          color: "var(--fg-muted)",
          borderTop: "1px solid var(--border)",
        }}
      >
        © {new Date().getFullYear()} CVisual · Fait avec ♥
      </footer>
    </div>
  );
}

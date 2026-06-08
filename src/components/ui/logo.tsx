import Link from "next/link";

/**
 * The CVisual serif-"C" tile — a hand-built vector glyph (no webfont
 * dependency, so it renders identically as a favicon / PWA icon / inline mark).
 * Editorial card treatment: paper tile, ink hairline, hard ink offset shadow,
 * sharp corners, brique serif C. Authored in a 40×40 space, scaled via `size`.
 */
export function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0, alignSelf: "center" }}
    >
      {/* hard offset shadow (echoes the dialog/card system) */}
      <rect x="5.6" y="5.6" width="31" height="31" rx="3.1" fill="var(--ink)" />
      {/* paper tile + ink hairline keyline */}
      <rect
        x="3.4"
        y="3.4"
        width="31"
        height="31"
        rx="3.1"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="1"
      />
      {/* brique serif C */}
      <g transform="translate(6.52 5.44) scale(0.2692)" fill="var(--accent)">
        <path d="M79.95 26.6 A38 38 0 1 0 79.95 73.4 L76.35 62.72 A24 24 0 1 1 76.35 37.28 Z" />
      </g>
    </svg>
  );
}

interface LogoProps {
  /** Wordmark font-size (mark + ® scale from it). Default 25px. */
  size?: number;
  /** Link target. Pass null to render a plain span (no link). Default "/". */
  href?: string | null;
  /** Show the serif-C tile glyph before the wordmark. Default true. */
  mark?: boolean;
  className?: string;
}

/**
 * Editorial CVisual® lockup — serif-C tile + serif wordmark + brique mono ®.
 * Single source for the logo used across header, auth screens, and footer.
 */
export function Logo({
  size = 25,
  href = "/",
  mark = true,
  className,
}: LogoProps) {
  const lockup = (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: mark ? Math.round(size * 0.4) : 0,
        fontFamily: "var(--serif)",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.01em",
        color: "var(--ink)",
      }}
    >
      {mark && <LogoMark size={Math.round(size * 1.2)} />}
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 3 }}>
        CVisual
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: Math.round(size * 0.44),
            fontWeight: 500,
            color: "var(--accent-strong)",
            alignSelf: "flex-start",
          }}
        >
          ®
        </span>
      </span>
    </span>
  );

  if (href === null) return lockup;
  return (
    <Link href={href} aria-label="CVisual" className="inline-flex">
      {lockup}
    </Link>
  );
}

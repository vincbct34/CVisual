import Link from "next/link";

interface LogoProps {
  /** Wordmark font-size (the ® scales from it). Default 25px. */
  size?: number;
  /** Link target. Pass null to render a plain span (no link). Default "/". */
  href?: string | null;
  className?: string;
}

/**
 * Editorial CVisual® wordmark — serif wordmark + brique mono registered mark.
 * Single source for the logo used across header, auth screens, and footer.
 */
export function Logo({ size = 25, href = "/", className }: LogoProps) {
  const inner = (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 3,
        fontFamily: "var(--serif)",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.01em",
        color: "var(--ink)",
      }}
    >
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
  );

  if (href === null) return inner;
  return (
    <Link href={href} aria-label="CVisual" className="inline-flex">
      {inner}
    </Link>
  );
}

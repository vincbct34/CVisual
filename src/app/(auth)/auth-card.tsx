"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

// Shared editorial card chrome for the auth screens (login / register / forgot /
// reset). Flat paper, hairline ink border, hard offset shadow.
const cardStyle: CSSProperties = {
  background: "var(--card-bg)",
  border: "1px solid var(--ink)",
  boxShadow: "10px 12px 0 -2px var(--paper), 10px 12px 0 0 var(--ink)",
};

export function AuthCard({
  children,
  animated = false,
  outerClassName = "px-4",
}: {
  children: ReactNode;
  /** Entrance animation (used by the login screen). */
  animated?: boolean;
  /** Extra classes on the full-screen centering wrapper (e.g. vertical padding). */
  outerClassName?: string;
}) {
  const cardClassName = "w-full max-w-md rounded-md p-8 relative z-10";
  return (
    <div
      className={`flex min-h-screen items-center justify-center ${outerClassName}`}
      style={{ background: "var(--bg)" }}
    >
      {animated ? (
        <motion.div
          className={cardClassName}
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={cardStyle}
        >
          {children}
        </motion.div>
      ) : (
        <div className={cardClassName} style={cardStyle}>
          {children}
        </div>
      )}
    </div>
  );
}

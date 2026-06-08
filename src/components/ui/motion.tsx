"use client";

/**
 * Animation primitives (framer-motion wrappers).
 *
 * IMPORTANT: `motion` is NOT re-exported from here on purpose —
 * re-exporting it through a barrel causes Turbopack to traverse the entire
 * framer-motion graph and hang. Import motion directly:
 *   import { motion } from "framer-motion";
 */

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

// ── Shared variants ────────────────────────────────────────────

export const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

export const springTransition = {
  type: "spring",
  stiffness: 80,
  damping: 15,
} as const;

export const cardHover = {
  whileHover: {
    y: -2,
    boxShadow: "8px 9px 0 0 var(--ink)",
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
  whileTap: { scale: 0.99 },
};

// ── Pre-built wrappers ─────────────────────────────────────────

/** Fades in from 30px below on mount */
export function FadeUp({
  delay = 0,
  className,
  children,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Staggers children on mount */
export function StaggerList({
  className,
  children,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Child of a Stagger* container */
export function StaggerItem({
  className,
  children,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={fadeUpItem}
      transition={springTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Glass card with hover lift + spring */
export function AnimatedCard({
  className,
  children,
  style,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={fadeUpItem}
      whileHover={cardHover.whileHover}
      whileTap={cardHover.whileTap}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
}

"use client";

/**
 * 404Factory animation primitives.
 *
 * IMPORTANT: `motion` is NOT re-exported from here on purpose —
 * re-exporting it through a barrel causes Turbopack to traverse the entire
 * framer-motion graph and hang. Import motion directly:
 *   import { motion } from "framer-motion";
 */

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

export { AnimatePresence, useMotionValue, useSpring };

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

export const staggerContainerSlow = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.25 },
  },
};

export const springTransition = {
  type: "spring",
  stiffness: 80,
  damping: 15,
} as const;

export const scrollViewport = { once: true, amount: 0.12 };

export const cardHover = {
  whileHover: {
    y: -8,
    scale: 1.02,
    boxShadow: "0 20px 40px -15px rgba(139,92,246,0.18)",
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
  whileTap: { scale: 0.98 },
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

/** Fades in from below when scrolled into view */
export function FadeUpScroll({
  delay = 0,
  className,
  children,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={scrollViewport}
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
  slow = false,
  ...props
}: HTMLMotionProps<"div"> & { slow?: boolean }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slow ? staggerContainerSlow : staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Staggers children when scrolled into view */
export function StaggerListScroll({
  className,
  children,
  slow = false,
  ...props
}: HTMLMotionProps<"div"> & { slow?: boolean }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={scrollViewport}
      variants={slow ? staggerContainerSlow : staggerContainer}
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

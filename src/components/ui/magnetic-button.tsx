"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  /** Pull strength — 0.28–0.35, default 0.3 */
  strength?: number;
  /** Active hover zone in px beyond the element boundary */
  padding?: number;
  className?: string;
}

/**
 * Wraps any button/element with the 404Factory magnetic pull effect.
 * The element gently follows the cursor while hovered.
 *
 * Usage:
 *   <MagneticButton>
 *     <button className="btn-gradient">Click me</button>
 *   </MagneticButton>
 */
export function MagneticButton({
  children,
  strength = 0.3,
  padding = 26,
  className,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const sx = useSpring(x, { stiffness: 120, damping: 10, mass: 0.1 });
  const sy = useSpring(y, { stiffness: 120, damping: 10, mass: 0.1 });

  function handleMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  // Expand the hit area so the magnet activates slightly before the cursor touches the element.
  // content-box keeps width:100% (w-full) from absorbing the padding, so the negative margins
  // stay symmetric and the element isn't shifted off-center.
  const hitStyle = {
    padding,
    margin: -padding,
    boxSizing: "content-box",
  } as const;

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy, display: "inline-flex", ...hitStyle }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  reducedRevealVariants,
  revealTransition,
  revealVariants,
} from "@/lib/motion";
import type { ReactNode } from "react";

/**
 * Scroll reveal. Eased rather than springy — springs read as playful at page
 * scale, which is wrong for this design language. Collapses to opacity-only
 * when the visitor prefers reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-15%" }}
      variants={reduced ? reducedRevealVariants : revealVariants}
      transition={{ ...revealTransition, delay }}
    >
      {children}
    </motion.div>
  );
}

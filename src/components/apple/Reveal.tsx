"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  reducedRevealVariants,
  revealTransition,
  revealVariants,
} from "@/lib/motion";
import type { ReactNode } from "react";

/**
 * Scroll reveal. Eased rather than springy — springs read as playful at page
 * scale, which is wrong for this design language.
 *
 * Fails open: the hidden initial state is only applied after mount, so the
 * server-rendered HTML is fully visible. Without this, a hydration failure
 * would leave `opacity: 0` baked into the markup and the content permanently
 * invisible. Reduced-motion visitors get no transform, only a fade.
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

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

import type { Transition, Variants } from "framer-motion";

/**
 * Motion values from apple-ui-brain/00-foundations/motion-haptics.md.
 * Scroll reveals are eased rather than springy — springs read as playful at
 * page scale, which is wrong for this design language.
 */

export const smooth: Transition = { type: "spring", duration: 0.5, bounce: 0 };
export const snappy: Transition = { type: "spring", duration: 0.4, bounce: 0.15 };

export const revealEase = [0.16, 1, 0.3, 1] as const;

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const revealTransition: Transition = {
  duration: 0.6,
  ease: revealEase,
};

/** Collapses a reveal to opacity-only when the user prefers reduced motion. */
export const reducedRevealVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

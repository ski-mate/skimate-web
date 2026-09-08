"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { primaryNav } from "@/content/nav";

/**
 * Mobile navigation. A height-animated panel dropping from the bar rather than
 * a bottom sheet — which is why this project has no need for vaul.
 */
export function NavPanel({ id, open }: { id: string; open: boolean }) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          id={id}
          key="panel"
          initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden lg:hidden"
        >
          <ul className="container-wide flex flex-col pb-6 pt-2">
            {primaryNav.map((item) => (
              <li key={item.href} className="border-b border-[var(--separator)]">
                <Link
                  href={item.href}
                  className="block py-3.5 type-title text-[var(--label)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

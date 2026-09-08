"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AlplineMark, Close, Menu } from "@/components/icons";
import { primaryNav } from "@/content/nav";
import { cn } from "@/lib/utils";
import { NavPanel } from "./NavPanel";

/**
 * The sticky translucent global bar: 44px on desktop, 48px on mobile.
 * Content scrolls beneath it — that underlap is what makes the material read
 * as glass rather than as a flat tinted strip.
 */
export function GlobalNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the panel on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header
      data-scheme="auto"
      className="material-nav sticky top-0 z-50 !bg-[var(--nav-material)] border-b border-[var(--separator)]"
    >
      <nav
        aria-label="Global"
        className="container-wide flex h-nav items-center justify-between"
      >
        <Link
          href="/"
          aria-label="Alpline home"
          className="flex items-center gap-1.5 text-[var(--label)]"
        >
          <AlplineMark className="h-[18px] w-[18px]" />
          <span className="type-nav font-semibold tracking-normal">Alpline</span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {primaryNav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "type-nav transition-opacity hover:opacity-100",
                    active
                      ? "text-[var(--label)] opacity-100"
                      : "text-[var(--label)] opacity-80"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="global-nav-panel"
          className="-mr-2 flex h-11 w-11 items-center justify-center text-[var(--label)] lg:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? (
            <Close className="h-3.5 w-3.5" />
          ) : (
            <Menu className="h-3 w-[18px]" />
          )}
        </button>
      </nav>

      <NavPanel id="global-nav-panel" open={open} />
    </header>
  );
}

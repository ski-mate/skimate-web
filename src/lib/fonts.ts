import { Inter } from "next/font/google";

/**
 * Inter is a *fallback* only. Apple-platform visitors resolve to real SF via
 * -apple-system in --font-stack and never download this, so preloading it would
 * waste bytes for most of the audience.
 */
export const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

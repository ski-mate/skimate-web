import type { Config } from "tailwindcss";

const config = {
  // Sections pin a scheme with data-scheme; "auto" resolves via prefers-color-scheme.
  darkMode: [
    "variant",
    [
      "&:where([data-scheme='dark'], [data-scheme='dark'] *)",
      "@media (prefers-color-scheme: dark) { &:where([data-scheme='auto'], [data-scheme='auto'] *) }",
    ],
  ],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    extend: {
      colors: {
        // Marketing namespace
        bg: "var(--bg)",
        "bg-elevated": "var(--bg-elevated)",
        "bg-inset": "var(--bg-inset)",
        label: "var(--label)",
        "label-2": "var(--label-2)",
        "label-3": "var(--label-3)",
        "label-4": "var(--label-4)",
        link: "var(--link)",
        "link-hover": "var(--link-hover)",
        separator: "var(--separator)",
        fill: "var(--fill)",
        "fill-strong": "var(--fill-strong)",

        // Piste difficulty, shared with the mobile app
        piste: {
          green: "var(--piste-green)",
          blue: "var(--piste-blue)",
          red: "var(--piste-red)",
          black: "var(--piste-black)",
          orange: "var(--piste-orange)",
        },

        // iOS namespace — device frames and /map chrome only
        ios: {
          blue: "var(--ios-blue)",
          label: "var(--ios-label)",
          "label-2": "var(--ios-label-2)",
          bg: "var(--ios-bg)",
          "bg-grouped": "var(--ios-bg-grouped)",
          fill: "var(--ios-fill)",
          "fill-tertiary": "var(--ios-fill-tertiary)",
          separator: "var(--ios-separator)",
        },

        // Compatibility aliases so the kept shadcn primitives keep rendering
        // until they are restyled in P1.
        background: "var(--bg)",
        foreground: "var(--label)",
        border: "var(--separator)",
        input: "var(--separator)",
        ring: "var(--link)",
        primary: { DEFAULT: "var(--link)", foreground: "#ffffff" },
        muted: { DEFAULT: "var(--bg-elevated)", foreground: "var(--label-3)" },
        accent: { DEFAULT: "var(--fill)", foreground: "var(--label)" },
      },
      maxWidth: {
        wide: "var(--container-wide)",
        content: "var(--container-content)",
        guide: "var(--container-guide)",
      },
      spacing: {
        gutter: "var(--gutter)",
        nav: "var(--nav-h)",
        section: "var(--section-y)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        card: "var(--radius-card)",
        tile: "var(--radius-tile)",
        large: "var(--radius-large)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        float: "var(--shadow-float)",
      },
      screens: {
        // apple.com's real breakpoints
        sm: "320px",
        md: "735px",
        lg: "1069px",
        xl: "1441px",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;

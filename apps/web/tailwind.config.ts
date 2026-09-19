import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-color)",
        canvas: "var(--canvas-bg)",
        surface: {
          DEFAULT: "var(--surface-color)",
          secondary: "var(--surface-secondary)",
          tertiary: "var(--surface-tertiary)",
        },
        border: {
          DEFAULT: "var(--border-color)",
          strong: "var(--border-strong)",
        },
        foreground: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          disabled: "var(--text-disabled)",
        },
        primary: {
          DEFAULT: "var(--primary-accent)",
          hover: "var(--primary-hover)",
          pressed: "var(--primary-pressed)",
          soft: "var(--primary-soft)",
          border: "var(--primary-border)",
          dark: "var(--primary-pressed)",
        },
        semantic: {
          blue: "var(--semantic-blue)",
          green: "var(--semantic-green)",
          red: "var(--semantic-red)",
          purple: "var(--semantic-purple)",
          teal: "var(--semantic-teal)",
          orange: "var(--semantic-orange)",
        },
        node: {
          bg: "var(--node-bg)",
          border: "var(--node-border)",
        },
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "8px",
        lg: "12px",
        dialog: "14px",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        panel:
          "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)",
        modal: "0 12px 32px 0 rgba(0, 0, 0, 0.30)",
      },
    },
  },
  plugins: [],
};

export default config;

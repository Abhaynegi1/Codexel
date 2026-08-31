import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8F7F3",
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F3F2EE",
        },
        border: {
          DEFAULT: "#E5E2DA",
          strong: "#D5D1C8",
        },
        foreground: {
          DEFAULT: "#171717",
          secondary: "#5F5C56",
          muted: "#8B8881",
        },
        primary: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
          soft: "#FEF3C7",
          dark: "#B45309",
        },
        semantic: {
          blue: "#3B82F6",
          green: "#22C55E",
          red: "#EF4444",
          purple: "#8B5CF6",
          teal: "#14B8A6",
          orange: "#F59E0B",
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
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        panel: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;

"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-md bg-surface border border-border hover:border-border-strong hover:bg-surface-secondary active:scale-90 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary overflow-hidden cursor-pointer ${className}`}
    >
      {/* Sun icon (visible in light mode) */}
      <Sun
        className={`w-4 h-4 text-amber-500 transition-all duration-300 ease-in-out transform ${
          isDark
            ? "rotate-90 scale-0 opacity-0 absolute"
            : "rotate-0 scale-100 opacity-100"
        }`}
      />

      {/* Moon icon (visible in dark mode) */}
      <Moon
        className={`w-4 h-4 text-amber-400 transition-all duration-300 ease-in-out transform ${
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0 absolute"
        }`}
      />
    </button>
  );
}

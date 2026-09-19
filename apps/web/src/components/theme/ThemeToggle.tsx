"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const options: Array<{
    id: Theme;
    label: string;
    icon: React.ElementType;
  }> = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];

  // Current active icon to display on the trigger button
  const ActiveIcon =
    theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Toggle theme (currently ${theme})`}
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
        className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-surface border border-border hover:border-border-strong text-foreground-secondary hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <ActiveIcon className="w-4 h-4 text-foreground-secondary hover:text-foreground transition-transform" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-lg bg-surface border border-border shadow-modal py-1 z-50 animate-in fade-in zoom-in-95 duration-100 font-mono text-xs">
          <div className="px-2.5 py-1 text-[10px] text-foreground-muted uppercase tracking-wider border-b border-border/60">
            Theme
          </div>
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setTheme(option.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left transition-colors ${
                  isSelected
                    ? "bg-primary-soft text-foreground font-semibold"
                    : "text-foreground-secondary hover:bg-surface-secondary hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-3.5 h-3.5 ${isSelected ? "text-primary" : "text-foreground-muted"}`}
                  />
                  <span>{option.label}</span>
                </div>
                {isSelected && <Check className="w-3 h-3 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

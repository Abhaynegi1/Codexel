"use client";

import React, { useState, useMemo } from "react";
import { Check, Copy, Palette, Search, Filter } from "lucide-react";
import type { DesignTokenColor } from "@codexel/shared";

interface ColorPaletteViewProps {
  colorPalette: DesignTokenColor[];
  cssVariables: Record<string, string>;
}

type ColorFilterRole = "all" | "base" | "brand" | "accent" | "semantic";

export function ColorPaletteView({
  colorPalette,
  cssVariables,
}: ColorPaletteViewProps) {
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<ColorFilterRole>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopy = (name: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 2000);
  };

  const categorizedColors = useMemo(() => {
    return colorPalette.map((color) => {
      const lower = color.name.toLowerCase();
      let role: ColorFilterRole = "all";

      if (lower.includes("bg") || lower.includes("background") || lower.includes("card") || lower.includes("border") || lower.includes("input")) {
        role = "base";
      } else if (lower.includes("primary") || lower.includes("ring") || lower.includes("brand")) {
        role = "brand";
      } else if (lower.includes("secondary") || lower.includes("accent") || lower.includes("muted")) {
        role = "accent";
      } else if (lower.includes("destructive") || lower.includes("error") || lower.includes("success") || lower.includes("warning")) {
        role = "semantic";
      }

      return { ...color, role };
    });
  }, [colorPalette]);

  const filteredColors = useMemo(() => {
    return categorizedColors.filter((color) => {
      if (filterRole !== "all" && color.role !== filterRole) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return color.name.toLowerCase().includes(q) || color.value.toLowerCase().includes(q);
      }
      return true;
    });
  }, [categorizedColors, filterRole, searchQuery]);

  return (
    <div className="space-y-5 select-none">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search color name or value..."
            className="w-full text-xs font-mono bg-surface-secondary text-foreground pl-8 pr-3 py-1.5 rounded-md border border-border focus:border-border-strong focus:outline-none"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilterRole("all")}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              filterRole === "all"
                ? "bg-primary text-white border-primary font-semibold"
                : "bg-surface border-border text-foreground-secondary hover:text-foreground"
            }`}
          >
            All ({colorPalette.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterRole("brand")}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              filterRole === "brand"
                ? "bg-primary text-white border-primary font-semibold"
                : "bg-surface border-border text-foreground-secondary hover:text-foreground"
            }`}
          >
            Primary / Brand
          </button>
          <button
            type="button"
            onClick={() => setFilterRole("base")}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              filterRole === "base"
                ? "bg-primary text-white border-primary font-semibold"
                : "bg-surface border-border text-foreground-secondary hover:text-foreground"
            }`}
          >
            Base &amp; Surfaces
          </button>
          <button
            type="button"
            onClick={() => setFilterRole("accent")}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              filterRole === "accent"
                ? "bg-primary text-white border-primary font-semibold"
                : "bg-surface border-border text-foreground-secondary hover:text-foreground"
            }`}
          >
            Muted &amp; Accents
          </button>
          <button
            type="button"
            onClick={() => setFilterRole("semantic")}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              filterRole === "semantic"
                ? "bg-primary text-white border-primary font-semibold"
                : "bg-surface border-border text-foreground-secondary hover:text-foreground"
            }`}
          >
            Semantic
          </button>
        </div>
      </div>

      {/* Swatches Grid */}
      {filteredColors.length === 0 ? (
        <div className="p-8 text-center bg-surface rounded-lg border border-border text-foreground-muted font-mono text-xs">
          No color tokens match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredColors.map((color) => {
            const isCopied = copiedName === color.name;

            return (
              <div
                key={color.name}
                className="group rounded-lg border border-border bg-surface overflow-hidden hover:border-border-strong hover:shadow-subtle transition-all flex flex-col"
              >
                {/* Live Swatch Preview */}
                <div
                  className="h-20 w-full relative border-b border-border/70 flex items-end p-2.5"
                  style={{ backgroundColor: color.value }}
                >
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/60 text-white backdrop-blur-sm shadow-sm">
                    {color.name}
                  </span>
                </div>

                {/* Token Details */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5 font-mono text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground truncate">
                        --{color.name}
                      </span>
                      <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-surface-secondary text-foreground-muted border border-border">
                        {color.source}
                      </span>
                    </div>

                    <div className="text-[11px] text-foreground-secondary truncate bg-surface-secondary/70 p-1.5 rounded border border-border/50">
                      {color.value}
                    </div>
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(color.name, color.value)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-surface-secondary hover:bg-primary hover:text-white text-foreground-secondary text-[11px] font-semibold border border-border transition-colors group-hover:border-border-strong"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied Value</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Value</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

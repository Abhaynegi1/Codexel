"use client";

import React, { useState } from "react";
import {
  Palette,
  Type,
  Maximize2,
  BarChart3,
  Boxes,
  Layers,
  Sparkles,
  Package,
  Sliders,
  FileCode,
  ShieldCheck,
} from "lucide-react";
import type { DesignSystemSummary } from "@codexel/shared";
import { ColorPaletteView } from "./ColorPaletteView";
import { TypographyLadderView } from "./TypographyLadderView";
import { TailwindClassHistogram } from "./TailwindClassHistogram";

interface DesignSystemExplorerProps {
  designSystem: DesignSystemSummary;
}

type SubTab = "colors" | "typography" | "spacing-radii" | "utilities" | "libraries";

export function DesignSystemExplorer({ designSystem }: DesignSystemExplorerProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("colors");

  const {
    colorPalette,
    typography,
    spacing,
    borderRadii,
    detectedCssVariables,
    topTailwindClasses,
    libraries,
  } = designSystem;

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden select-none font-mono text-xs">
      {/* Top Header & Navigation Sub-Tabs */}
      <div className="p-3 bg-surface border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Navigation Pills */}
        <div className="flex items-center gap-1.5 bg-surface-secondary p-1 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setActiveSubTab("colors")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === "colors"
                ? "bg-surface text-foreground font-bold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-primary" />
            <span>Colors ({colorPalette.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("typography")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === "typography"
                ? "bg-surface text-foreground font-bold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Type className="w-3.5 h-3.5 text-primary" />
            <span>Typography</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("spacing-radii")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === "spacing-radii"
                ? "bg-surface text-foreground font-bold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Spacing &amp; Radii</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("utilities")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === "utilities"
                ? "bg-surface text-foreground font-bold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span>Top 50 Utilities</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("libraries")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === "libraries"
                ? "bg-surface text-foreground font-bold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Package className="w-3.5 h-3.5 text-primary" />
            <span>UI Ecosystem</span>
          </button>
        </div>

        {/* High-level status chip */}
        <div className="flex items-center gap-2 text-foreground-muted text-[11px]">
          <div className="flex items-center gap-1 text-semantic-green">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Extracted Visual DNA</span>
          </div>
          <span>&bull;</span>
          <span>{Object.keys(detectedCssVariables).length} CSS variables</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Sub-Tab 1: Colors & Palettes */}
          {activeSubTab === "colors" && (
            <ColorPaletteView
              colorPalette={colorPalette}
              cssVariables={detectedCssVariables}
            />
          )}

          {/* Sub-Tab 2: Typography Ladder */}
          {activeSubTab === "typography" && (
            <TypographyLadderView typography={typography} />
          )}

          {/* Sub-Tab 3: Spacing & Radii */}
          {activeSubTab === "spacing-radii" && (
            <div className="space-y-6">
              {/* Spacing Tokens */}
              <div className="bg-surface p-5 rounded-lg border border-border space-y-4">
                <div className="border-b border-border/70 pb-2">
                  <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Spacing Scale &amp; Metrics ({spacing.length} values)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {spacing.map((val, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-surface-secondary/40 border border-border space-y-2 hover:border-border-strong transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-primary">{val}</span>
                        <span className="text-foreground-muted text-[10px]">
                          Token #{idx + 1}
                        </span>
                      </div>

                      {/* Visual bar illustrating width */}
                      <div className="h-4 bg-primary/20 rounded border border-primary/30 flex items-center px-1">
                        <div
                          className="h-2 bg-primary rounded-sm"
                          style={{
                            width: val.includes("px")
                              ? `${Math.min(100, parseInt(val, 10) * 2)}%`
                              : "50%",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Border Radii Tokens */}
              <div className="bg-surface p-5 rounded-lg border border-border space-y-4">
                <div className="border-b border-border/70 pb-2">
                  <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Border Radii Scale ({borderRadii.length} values)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {borderRadii.map((radius, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-surface-secondary/40 border border-border space-y-3 hover:border-border-strong transition-all flex flex-col items-center text-center"
                    >
                      {/* Visual Box with live border-radius */}
                      <div
                        className="w-16 h-16 bg-primary/15 border-2 border-primary shadow-subtle flex items-center justify-center text-[10px] text-primary font-bold"
                        style={{ borderRadius: radius }}
                      >
                        Box
                      </div>

                      <div>
                        <span className="font-bold text-foreground block text-xs truncate max-w-full">
                          {radius}
                        </span>
                        <span className="text-foreground-muted text-[10px]">
                          Radius Step {idx + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 4: Top 50 Tailwind Classes */}
          {activeSubTab === "utilities" && (
            <TailwindClassHistogram topClasses={topTailwindClasses} />
          )}

          {/* Sub-Tab 5: UI Stack & Libraries */}
          {activeSubTab === "libraries" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* UI Primitive */}
                <div className="p-5 rounded-lg bg-surface border border-border space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Boxes className="w-5 h-5" />
                    <h3 className="font-bold text-sm text-foreground font-sans">
                      UI Component Primitives
                    </h3>
                  </div>
                  <p className="text-[11px] text-foreground-muted">
                    Underlying headless primitives or UI kit used for accessible components.
                  </p>
                  <div className="p-3 rounded bg-surface-secondary border border-border text-foreground font-bold text-sm">
                    {libraries.uiPrimitiveLibrary || "Custom / HTML Primitives"}
                  </div>
                </div>

                {/* Icon Library */}
                <div className="p-5 rounded-lg bg-surface border border-border space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold text-sm text-foreground font-sans">
                      Iconography Pack
                    </h3>
                  </div>
                  <p className="text-[11px] text-foreground-muted">
                    Icon system imported across features, buttons, and navigation.
                  </p>
                  <div className="p-3 rounded bg-surface-secondary border border-border text-foreground font-bold text-sm">
                    {libraries.iconLibrary || "Inline SVG / Custom"}
                  </div>
                </div>

                {/* Animation Library */}
                <div className="p-5 rounded-lg bg-surface border border-border space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Sliders className="w-5 h-5" />
                    <h3 className="font-bold text-sm text-foreground font-sans">
                      Animation &amp; Motion
                    </h3>
                  </div>
                  <p className="text-[11px] text-foreground-muted">
                    Motion library driving transitions, dialog popups, and enter states.
                  </p>
                  <div className="p-3 rounded bg-surface-secondary border border-border text-foreground font-bold text-sm">
                    {libraries.animationLibrary || "CSS Keyframes / Transitions"}
                  </div>
                </div>
              </div>

              {/* Raw CSS Variables Inspector */}
              <div className="bg-surface p-5 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between border-b border-border/70 pb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">
                      Detected CSS Custom Properties ({Object.keys(detectedCssVariables).length})
                    </h3>
                  </div>
                  <span className="text-foreground-muted text-[10px]">
                    Extracted from workspace stylesheets
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(detectedCssVariables).map(([name, val], idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-surface-secondary/40 border border-border flex items-center justify-between text-[11px] gap-2"
                    >
                      <span className="font-bold text-foreground truncate">{name}</span>
                      <span className="text-foreground-secondary truncate max-w-[120px]">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

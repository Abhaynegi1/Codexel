"use client";

import React, { useState } from "react";
import { Type, Sparkles, Sliders } from "lucide-react";

interface TypographyLadderViewProps {
  typography: {
    fontFamilies: string[];
    fontSizes: string[];
    fontWeights: string[];
  };
}

const FONT_WEIGHT_LABELS: Record<string, string> = {
  "100": "Thin",
  "200": "Extra Light",
  "300": "Light",
  "400": "Regular",
  "500": "Medium",
  "600": "Semi Bold",
  "700": "Bold",
  "800": "Extra Bold",
  "900": "Black",
};

export function TypographyLadderView({ typography }: TypographyLadderViewProps) {
  const [sampleText, setSampleText] = useState(
    "The quick brown fox jumps over the lazy dog.",
  );
  const [selectedFont, setSelectedFont] = useState(
    typography.fontFamilies[0] || "sans-serif",
  );

  return (
    <div className="space-y-6 select-none font-mono text-xs">
      {/* Interactive Controls Bar */}
      <div className="bg-surface p-4 rounded-lg border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground text-sm font-sans">
              Typography Playground &amp; Scale
            </span>
          </div>

          {/* Font Family Selector */}
          <div className="flex items-center gap-2">
            <span className="text-foreground-muted text-[11px]">Font Family:</span>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="bg-surface-secondary text-foreground text-xs font-mono px-2.5 py-1 rounded border border-border focus:outline-none"
            >
              {typography.fontFamilies.map((font, idx) => (
                <option key={idx} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Editable Sample Text */}
        <div>
          <label className="text-[10px] uppercase text-foreground-muted block mb-1">
            Preview Text
          </label>
          <input
            type="text"
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            className="w-full bg-surface-secondary text-foreground text-xs px-3 py-1.5 rounded-md border border-border focus:border-border-strong focus:outline-none"
          />
        </div>
      </div>

      {/* 1. Type Scale Ladder */}
      <div className="bg-surface p-5 rounded-lg border border-border space-y-4">
        <div className="flex items-center justify-between border-b border-border/70 pb-2">
          <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">
            Type Scale Ladder ({typography.fontSizes.length} sizes)
          </h3>
          <span className="text-[11px] text-foreground-muted">
            Rendered in {selectedFont}
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {typography.fontSizes.map((size, idx) => (
            <div
              key={idx}
              className="py-4 flex flex-col md:flex-row md:items-baseline justify-between gap-3 group hover:bg-surface-secondary/20 px-2 rounded transition-colors"
            >
              <div className="w-28 shrink-0 flex items-center gap-2 text-foreground-muted text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border text-primary font-bold">
                  {size}
                </span>
                <span>Step {idx + 1}</span>
              </div>

              <div
                className="flex-1 text-foreground transition-all truncate"
                style={{
                  fontSize: size,
                  fontFamily: selectedFont,
                  lineHeight: 1.25,
                }}
              >
                {sampleText}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Font Weight Ladder */}
      <div className="bg-surface p-5 rounded-lg border border-border space-y-4">
        <div className="border-b border-border/70 pb-2">
          <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">
            Weight Scale &amp; Contrast
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {typography.fontWeights.map((weight, idx) => {
            const label = FONT_WEIGHT_LABELS[weight] || weight;

            return (
              <div
                key={idx}
                className="p-4 rounded-lg bg-surface-secondary/40 border border-border space-y-2 hover:border-border-strong transition-all"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-primary">
                    {weight} — {label}
                  </span>
                  <span className="text-foreground-muted text-[10px]">
                    font-weight: {weight}
                  </span>
                </div>

                <div
                  className="text-foreground text-sm leading-relaxed"
                  style={{
                    fontWeight: Number(weight) || 400,
                    fontFamily: selectedFont,
                  }}
                >
                  {sampleText}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

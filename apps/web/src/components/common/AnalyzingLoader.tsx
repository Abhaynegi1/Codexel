"use client";

import React, { useState, useEffect } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Layers, Cpu, ShieldCheck, Palette } from "lucide-react";

interface AnalyzingLoaderProps {
  repoName?: string;
  title?: string;
  description?: string;
}

interface StageInfo {
  icon: React.ElementType;
  label: string;
  detail: string;
}

const STAGES: StageInfo[] = [
  {
    icon: Cpu,
    label: "Scanning Filesystem & Dependencies",
    detail: "Parsing package manifests and AST imports",
  },
  {
    icon: Layers,
    label: "Synthesizing Architecture Graph",
    detail: "Classifying layer boundaries & import compliance",
  },
  {
    icon: Palette,
    label: "Extracting Design System & Components",
    detail: "Harvesting CSS variables, Tailwind tokens & props",
  },
  {
    icon: ShieldCheck,
    label: "Verifying Deterministic Blueprint",
    detail: "Zero hallucinations with verified source citations",
  },
];

const DEFAULT_STAGE: StageInfo = STAGES[0]!;

export function AnalyzingLoader({
  repoName,
  title = "Analyzing Codebase Architecture",
  description,
}: AnalyzingLoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const currentStage: StageInfo = STAGES[stageIndex] ?? DEFAULT_STAGE;
  const CurrentIcon = currentStage.icon;

  return (
    <div className="flex-1 min-h-[480px] w-full flex flex-col items-center justify-center p-8 text-center bg-background bg-blueprint-grid select-none animate-in fade-in duration-300">
      <div className="max-w-md w-full flex flex-col items-center space-y-6">
        {/* Lottie Animation Container */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-full h-full">
            <DotLottieReact
              src="/animations/loader.lottie"
              loop
              autoplay
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Status Header */}
        <div className="space-y-2 font-mono">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-primary/10 border border-primary/20 text-primary font-semibold">
            <CurrentIcon className="w-3.5 h-3.5 animate-pulse" />
            <span>{currentStage.label}</span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight font-sans">
            {title}
          </h2>

          <p className="text-xs text-foreground-muted max-w-sm mx-auto leading-relaxed">
            {description ||
              (repoName
                ? `Resolving AST symbols & layers for ${repoName}...`
                : currentStage.detail)}
          </p>
        </div>

        {/* Progress Stage Dots */}
        <div className="flex items-center gap-1.5 pt-2">
          {STAGES.map((s, idx) => (
            <div
              key={s.label}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === stageIndex
                  ? "w-6 bg-primary"
                  : idx < stageIndex
                    ? "w-2 bg-primary/40"
                    : "w-2 bg-surface-secondary border border-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

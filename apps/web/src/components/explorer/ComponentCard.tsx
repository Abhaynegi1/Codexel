"use client";

import React from "react";
import {
  Component as ComponentIcon,
  Layers,
  FileCode,
  ArrowUpRight,
  Sparkles,
  Shield,
  Eye,
} from "lucide-react";
import type { DiscoveredComponent } from "@codexel/shared";

interface ComponentCardProps {
  component: DiscoveredComponent;
  isSelected: boolean;
  onSelect: (component: DiscoveredComponent) => void;
}

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "ui-primitive": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  "feature-component": {
    bg: "bg-blue-500/10",
    text: "text-blue-500 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  form: {
    bg: "bg-amber-500/10",
    text: "text-amber-500 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  modal: {
    bg: "bg-purple-500/10",
    text: "text-purple-500 dark:text-purple-400",
    border: "border-purple-500/20",
  },
  navigation: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-500 dark:text-indigo-400",
    border: "border-indigo-500/20",
  },
  page: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-500 dark:text-cyan-400",
    border: "border-cyan-500/20",
  },
  layout: {
    bg: "bg-sky-500/10",
    text: "text-sky-500 dark:text-sky-400",
    border: "border-sky-500/20",
  },
  table: {
    bg: "bg-teal-500/10",
    text: "text-teal-500 dark:text-teal-400",
    border: "border-teal-500/20",
  },
  chart: {
    bg: "bg-rose-500/10",
    text: "text-rose-500 dark:text-rose-400",
    border: "border-rose-500/20",
  },
  "shared-component": {
    bg: "bg-slate-500/10",
    text: "text-slate-500 dark:text-slate-400",
    border: "border-slate-500/20",
  },
  unknown: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-500 dark:text-zinc-400",
    border: "border-zinc-500/20",
  },
};

interface CategoryStyle {
  bg: string;
  text: string;
  border: string;
}

const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  bg: "bg-zinc-500/10",
  text: "text-zinc-500 dark:text-zinc-400",
  border: "border-zinc-500/20",
};

export function ComponentCard({
  component,
  isSelected,
  onSelect,
}: ComponentCardProps) {
  const categoryStyle: CategoryStyle =
    CATEGORY_COLORS[component.category] ?? DEFAULT_CATEGORY_STYLE;

  const fileName = component.filePath.split("/").pop() || component.filePath;
  const propCount = component.props.length;
  const childCount = component.childComponents.length;
  const usageCount = component.usedBy.length;

  return (
    <div
      onClick={() => onSelect(component)}
      className={`group relative text-left rounded-lg p-3.5 transition-all cursor-pointer border select-none ${
        isSelected
          ? "bg-surface-secondary border-primary ring-1 ring-primary shadow-subtle"
          : "bg-surface border-border hover:border-border-strong hover:bg-surface-secondary/50 shadow-sm"
      }`}
    >
      {/* Top row: Name & Category Pill */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 truncate">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${categoryStyle.border} ${categoryStyle.bg}`}
          >
            <ComponentIcon className={`w-3.5 h-3.5 ${categoryStyle.text}`} />
          </div>
          <div className="truncate">
            <h3 className="text-xs font-bold font-mono text-foreground truncate group-hover:text-primary transition-colors">
              {component.name}
            </h3>
            <span className="text-[10px] font-mono text-foreground-muted truncate block">
              {fileName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {["ui-primitive", "form", "modal", "navigation"].includes(
            component.category,
          ) && (
            <span
              title="Live Sandboxed Preview Available"
              className="flex items-center gap-1 text-[9px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"
            >
              <Eye className="w-2.5 h-2.5" />
              <span>Preview</span>
            </span>
          )}
          <span
            className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
          >
            {component.category.replace("-", " ")}
          </span>
        </div>
      </div>

      {/* Middle row: File Path */}
      <div className="text-[11px] font-mono text-foreground-muted truncate mb-3 flex items-center gap-1">
        <FileCode className="w-3 h-3 shrink-0" />
        <span className="truncate">{component.filePath}</span>
        <span className="shrink-0 text-[10px] opacity-60">
          :{component.lineStart}-{component.lineEnd}
        </span>
      </div>

      {/* Bottom stats row */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] font-mono text-foreground-secondary">
        <div className="flex items-center gap-2.5">
          <span title={`${propCount} Props defined`}>
            <strong className="text-foreground font-semibold">
              {propCount}
            </strong>{" "}
            props
          </span>
          <span>&bull;</span>
          <span title={`${childCount} JSX child components rendered`}>
            <strong className="text-foreground font-semibold">
              {childCount}
            </strong>{" "}
            children
          </span>
        </div>

        <div className="flex items-center gap-1">
          {usageCount > 0 ? (
            <span
              className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-medium text-[10px]"
              title={`Used by ${usageCount} other components/files`}
            >
              {usageCount} uses
            </span>
          ) : (
            <span className="text-foreground-muted text-[10px]">
              Leaf / Route
            </span>
          )}
          <ArrowUpRight className="w-3 h-3 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  Layers,
  Network,
  Search,
  X,
  RotateCcw,
  ArrowDown,
  ArrowRight,
  Filter,
} from "lucide-react";
import type { LayoutDirection } from "./layout";

export type ExplorerViewMode = "architecture" | "modules";
export type ExplorerFilterRole =
  "all" | "ui" | "features" | "server" | "infrastructure" | "shared-utils";

interface ExplorerToolbarProps {
  viewMode: ExplorerViewMode;
  onViewModeChange: (mode: ExplorerViewMode) => void;
  selectedFilter: ExplorerFilterRole;
  onFilterChange: (filter: ExplorerFilterRole) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  direction: LayoutDirection;
  onDirectionToggle: () => void;
  onResetLayout: () => void;
  nodeCount: number;
  edgeCount: number;
}

const FILTER_PILLS: Array<{ id: ExplorerFilterRole; label: string }> = [
  { id: "all", label: "All" },
  { id: "ui", label: "UI Primitives" },
  { id: "features", label: "Features" },
  { id: "server", label: "APIs & Server" },
  { id: "infrastructure", label: "Data / DB" },
  { id: "shared-utils", label: "Shared Utils" },
];

export function ExplorerToolbar({
  viewMode,
  onViewModeChange,
  selectedFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  direction,
  onDirectionToggle,
  onResetLayout,
  nodeCount,
  edgeCount,
}: ExplorerToolbarProps) {
  return (
    <div className="w-full bg-surface border-b border-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Left: View Mode Toggle */}
      <div className="flex items-center gap-1 bg-surface-secondary p-1 rounded-md border border-border">
        <button
          type="button"
          onClick={() => onViewModeChange("architecture")}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded transition-colors ${
            viewMode === "architecture"
              ? "bg-surface text-foreground font-semibold shadow-subtle"
              : "text-foreground-secondary hover:text-foreground"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span>Architecture Layers</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange("modules")}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded transition-colors ${
            viewMode === "modules"
              ? "bg-surface text-foreground font-semibold shadow-subtle"
              : "text-foreground-secondary hover:text-foreground"
          }`}
        >
          <Network className="w-3.5 h-3.5 text-primary" />
          <span>Module Graph</span>
        </button>
      </div>

      {/* Center: Search & Filter Pills */}
      <div className="flex items-center gap-2 flex-1 max-w-2xl min-w-[280px]">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search nodes, files, symbols..."
            className="w-full text-xs font-mono bg-surface-secondary text-foreground pl-8 pr-7 py-1.5 rounded-md border border-border focus:border-border-strong focus:outline-none focus:bg-surface transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills (only active in modules mode) */}
        {viewMode === "modules" && (
          <div className="hidden lg:flex items-center gap-1">
            <Filter className="w-3 h-3 text-foreground-muted mr-0.5" />
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => onFilterChange(pill.id)}
                className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
                  selectedFilter === pill.id
                    ? "bg-primary text-white border-primary font-medium"
                    : "bg-surface border-border text-foreground-secondary hover:border-border-strong hover:text-foreground"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Actions & Counters */}
      <div className="flex items-center gap-2 text-xs font-mono">
        {/* Direction Toggle */}
        <button
          type="button"
          onClick={onDirectionToggle}
          title={`Switch layout orientation (currently ${direction === "TB" ? "Vertical" : "Horizontal"})`}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-surface hover:bg-surface-secondary text-foreground-secondary hover:text-foreground transition-colors"
        >
          {direction === "TB" ? (
            <>
              <ArrowDown className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Vertical</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Horizontal</span>
            </>
          )}
        </button>

        {/* Reset Layout */}
        <button
          type="button"
          onClick={onResetLayout}
          title="Reset canvas and recalculate layout"
          className="p-1.5 rounded-md border border-border bg-surface hover:bg-surface-secondary text-foreground-secondary hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Counts badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-secondary border border-border text-[11px] text-foreground-muted font-mono">
          <span>{nodeCount} nodes</span>
          <span>&bull;</span>
          <span>{edgeCount} edges</span>
        </div>
      </div>
    </div>
  );
}

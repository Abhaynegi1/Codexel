"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Filter,
  Layers,
  Component as ComponentIcon,
  Sparkles,
  ArrowUpDown,
  Boxes,
  Code2,
  FileCode,
  LayoutGrid,
  List,
} from "lucide-react";
import type { ComponentInventory, DiscoveredComponent } from "@codexel/shared";
import { ComponentCard } from "./ComponentCard";
import { ComponentDetailView } from "./ComponentDetailView";

interface ComponentExplorerProps {
  inventory: ComponentInventory;
  initialComponentId?: string | null;
}

type SortOption = "name-asc" | "props-desc" | "usage-desc" | "lines-desc";

const CATEGORY_TABS: Array<{ id: string; label: string }> = [
  { id: "all", label: "All Categories" },
  { id: "ui-primitive", label: "UI Primitives" },
  { id: "feature-component", label: "Features" },
  { id: "form", label: "Forms" },
  { id: "modal", label: "Modals" },
  { id: "navigation", label: "Navigation" },
  { id: "page", label: "Pages" },
  { id: "layout", label: "Layouts" },
  { id: "shared-component", label: "Shared" },
];

export function ComponentExplorer({
  inventory,
  initialComponentId,
}: ComponentExplorerProps) {
  const components = inventory.components;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    initialComponentId || (components[0]?.id ?? null),
  );

  // Sync when initialComponentId changes
  useEffect(() => {
    if (initialComponentId) {
      setSelectedComponentId(initialComponentId);
    }
  }, [initialComponentId]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: components.length };
    for (const comp of components) {
      counts[comp.category] = (counts[comp.category] || 0) + 1;
    }
    return counts;
  }, [components]);

  // Filter and sort components
  const filteredComponents = useMemo(() => {
    return components
      .filter((comp) => {
        // Category filter
        if (selectedCategory !== "all" && comp.category !== selectedCategory) {
          return false;
        }

        // Search query filter (matches name, file path, or prop names)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = comp.name.toLowerCase().includes(q);
          const matchesFile = comp.filePath.toLowerCase().includes(q);
          const matchesProp = comp.props.some((p) =>
            p.name.toLowerCase().includes(q),
          );
          const matchesChild = comp.childComponents.some((c) =>
            c.toLowerCase().includes(q),
          );

          if (!matchesName && !matchesFile && !matchesProp && !matchesChild) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "props-desc") {
          return b.props.length - a.props.length;
        }
        if (sortBy === "usage-desc") {
          return b.usedBy.length - a.usedBy.length;
        }
        if (sortBy === "lines-desc") {
          const aLines = a.lineEnd - a.lineStart;
          const bLines = b.lineEnd - b.lineStart;
          return bLines - aLines;
        }
        return 0;
      });
  }, [components, selectedCategory, searchQuery, sortBy]);

  const selectedComponent = useMemo(() => {
    return (
      components.find((c) => c.id === selectedComponentId) ||
      filteredComponents[0] ||
      null
    );
  }, [components, selectedComponentId, filteredComponents]);

  const handleSelectByName = (name: string) => {
    const target = components.find((c) => c.name === name);
    if (target) {
      setSelectedComponentId(target.id);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="p-3 bg-surface border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Search bar */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components by name, file, or prop..."
            className="w-full text-xs font-mono bg-surface-secondary text-foreground pl-8 pr-8 py-1.5 rounded-md border border-border focus:border-border-strong focus:outline-none focus:bg-surface transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Pills (horizontal scroll on small viewports) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-2xl">
          {CATEGORY_TABS.map((tab) => {
            const count = categoryCounts[tab.id] || 0;
            if (tab.id !== "all" && count === 0) return null;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md border transition-colors shrink-0 ${
                  selectedCategory === tab.id
                    ? "bg-primary text-white border-primary font-semibold shadow-subtle"
                    : "bg-surface border-border text-foreground-secondary hover:border-border-strong hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedCategory === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-surface-secondary text-foreground-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort & Count Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1 bg-surface-secondary px-2 py-1 rounded-md border border-border">
            <ArrowUpDown className="w-3 h-3 text-foreground-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-foreground text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="props-desc">Most Props</option>
              <option value="usage-desc">Most Usages</option>
              <option value="lines-desc">Lines of Code</option>
            </select>
          </div>

          <span className="text-foreground-muted text-[11px] hidden sm:inline">
            Showing {filteredComponents.length} of {components.length}
          </span>
        </div>
      </div>

      {/* Main Split Layout: Catalog Grid + Detail Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Component Catalog List/Grid */}
        <div
          className={`flex-1 overflow-y-auto p-4 transition-all ${
            selectedComponent ? "w-full md:w-1/2 lg:w-7/12" : "w-full"
          }`}
        >
          {filteredComponents.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-surface-secondary/30 rounded-lg border border-border border-dashed font-mono">
              <ComponentIcon className="w-8 h-8 text-foreground-muted animate-pulse" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  No components match filter
                </h3>
                <p className="text-xs text-foreground-muted">
                  Try adjusting your search query or selected category.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="px-3 py-1.5 rounded-md bg-surface border border-border text-xs font-semibold text-primary hover:border-primary transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredComponents.map((comp) => (
                <ComponentCard
                  key={comp.id}
                  component={comp}
                  isSelected={selectedComponent?.id === comp.id}
                  onSelect={(c) => setSelectedComponentId(c.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Component Detail View Panel */}
        {selectedComponent && (
          <div className="hidden md:flex w-1/2 lg:w-5/12 h-full shrink-0">
            <ComponentDetailView
              component={selectedComponent}
              allComponents={components}
              onClose={() => setSelectedComponentId(null)}
              onSelectComponentById={(id) => setSelectedComponentId(id)}
              onSelectComponentByName={handleSelectByName}
            />
          </div>
        )}
      </div>

      {/* Mobile Drawer when selected */}
      {selectedComponent && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-16 z-40 bg-surface shadow-2xl flex flex-col">
          <ComponentDetailView
            component={selectedComponent}
            allComponents={components}
            onClose={() => setSelectedComponentId(null)}
            onSelectComponentById={(id) => setSelectedComponentId(id)}
            onSelectComponentByName={handleSelectByName}
          />
        </div>
      )}
    </div>
  );
}

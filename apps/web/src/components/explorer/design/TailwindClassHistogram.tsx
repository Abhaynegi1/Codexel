"use client";

import React, { useState, useMemo } from "react";
import { BarChart3, Copy, Check, Filter, Search } from "lucide-react";

interface UtilityClassCount {
  className: string;
  count: number;
}

interface TailwindClassHistogramProps {
  topClasses: UtilityClassCount[];
}

type ClassCategory =
  "all" | "layout" | "spacing" | "typography" | "color" | "borders";

export function TailwindClassHistogram({
  topClasses,
}: TailwindClassHistogramProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<ClassCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedClass, setCopiedClass] = useState<string | null>(null);

  const maxCount = useMemo(() => {
    return topClasses[0]?.count || 1;
  }, [topClasses]);

  const totalUsages = useMemo(() => {
    return topClasses.reduce((acc, c) => acc + c.count, 0);
  }, [topClasses]);

  const categorizeClass = (cls: string): ClassCategory => {
    if (
      cls.startsWith("flex") ||
      cls.startsWith("grid") ||
      cls.startsWith("items-") ||
      cls.startsWith("justify-") ||
      cls === "block" ||
      cls === "hidden" ||
      cls === "relative" ||
      cls === "absolute" ||
      cls.startsWith("col-") ||
      cls.startsWith("w-") ||
      cls.startsWith("h-")
    ) {
      return "layout";
    }

    if (
      cls.startsWith("p-") ||
      cls.startsWith("px-") ||
      cls.startsWith("py-") ||
      cls.startsWith("m-") ||
      cls.startsWith("mx-") ||
      cls.startsWith("my-") ||
      cls.startsWith("gap-") ||
      cls.startsWith("space-")
    ) {
      return "spacing";
    }

    if (
      (cls.startsWith("text-") &&
        (cls.includes("xs") ||
          cls.includes("sm") ||
          cls.includes("base") ||
          cls.includes("lg") ||
          cls.includes("xl") ||
          cls.includes("2xl"))) ||
      cls.startsWith("font-") ||
      cls.startsWith("leading-") ||
      cls.startsWith("tracking-")
    ) {
      return "typography";
    }

    if (
      cls.startsWith("bg-") ||
      (cls.startsWith("text-") &&
        !cls.includes("sm") &&
        !cls.includes("xs") &&
        !cls.includes("base")) ||
      (cls.startsWith("border-") &&
        (cls.includes("slate") ||
          cls.includes("border") ||
          cls.includes("primary")))
    ) {
      return "color";
    }

    if (
      cls.startsWith("rounded") ||
      cls.startsWith("border") ||
      cls.startsWith("shadow") ||
      cls.startsWith("transition")
    ) {
      return "borders";
    }

    return "layout";
  };

  const filteredClasses = useMemo(() => {
    return topClasses.filter((c) => {
      if (
        selectedCategory !== "all" &&
        categorizeClass(c.className) !== selectedCategory
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        return c.className
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim());
      }
      return true;
    });
  }, [topClasses, selectedCategory, searchQuery]);

  const handleCopy = (className: string) => {
    navigator.clipboard.writeText(className);
    setCopiedClass(className);
    setTimeout(() => setCopiedClass(null), 1500);
  };

  return (
    <div className="space-y-5 select-none font-mono text-xs">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter utility classes..."
            className="w-full text-xs font-mono bg-surface-secondary text-foreground pl-8 pr-3 py-1.5 rounded-md border border-border focus:border-border-strong focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1">
          {(
            [
              { id: "all", label: "All" },
              { id: "layout", label: "Layout" },
              { id: "spacing", label: "Spacing" },
              { id: "typography", label: "Typography" },
              { id: "color", label: "Color" },
              { id: "borders", label: "Borders / Effects" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                selectedCategory === cat.id
                  ? "bg-primary text-white border-primary font-semibold"
                  : "bg-surface border-border text-foreground-secondary hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-surface rounded-lg border border-border">
          <span className="text-foreground-muted text-[10px] uppercase block">
            Sampled Usages
          </span>
          <span className="text-lg font-bold text-foreground">
            {totalUsages}
          </span>
        </div>
        <div className="p-3 bg-surface rounded-lg border border-border">
          <span className="text-foreground-muted text-[10px] uppercase block">
            Top Utility Classes
          </span>
          <span className="text-lg font-bold text-foreground">
            {topClasses.length} cataloged
          </span>
        </div>
        <div className="p-3 bg-surface rounded-lg border border-border">
          <span className="text-foreground-muted text-[10px] uppercase block">
            Most Frequent Class
          </span>
          <span className="text-lg font-bold text-primary truncate block">
            {topClasses[0]?.className || "none"} ({topClasses[0]?.count || 0})
          </span>
        </div>
      </div>

      {/* Histogram Bars */}
      <div className="bg-surface p-5 rounded-lg border border-border space-y-3">
        <div className="flex items-center justify-between border-b border-border/70 pb-2 text-[11px] text-foreground-muted">
          <span>Utility Class Name</span>
          <span>Occurrence Frequency</span>
        </div>

        {filteredClasses.length === 0 ? (
          <div className="p-8 text-center text-foreground-muted">
            No utility classes match your filter.
          </div>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredClasses.map((item, idx) => {
              const pct = Math.max(
                8,
                Math.round((item.count / maxCount) * 100),
              );
              const isCopied = copiedClass === item.className;

              return (
                <div
                  key={idx}
                  onClick={() => handleCopy(item.className)}
                  className="group flex items-center justify-between gap-3 p-2 rounded hover:bg-surface-secondary cursor-pointer transition-colors"
                  title="Click to copy class"
                >
                  <div className="flex items-center gap-2 w-48 shrink-0 truncate">
                    <span className="text-foreground-muted text-[10px] w-6 text-right">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {item.className}
                    </span>
                  </div>

                  {/* Relative bar */}
                  <div className="flex-1 h-5 bg-surface-secondary/70 rounded-md overflow-hidden relative border border-border/40">
                    <div
                      className="h-full bg-primary/20 border-r-2 border-primary transition-all duration-300 rounded-l-md"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Count badge & Copy Indicator */}
                  <div className="w-20 shrink-0 text-right flex items-center justify-end gap-1.5">
                    <span className="text-foreground font-semibold">
                      {item.count}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-foreground-muted" />
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Code2,
  ListTree,
  Network,
  Share2,
  ExternalLink,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import type { DiscoveredComponent } from "@codexel/shared";

interface ComponentFallbackPlaceholderProps {
  component: DiscoveredComponent;
  blockers: string[];
  reason: string;
  onNavigateToTab: (tab: "code" | "props" | "usage" | "deps") => void;
}

export function ComponentFallbackPlaceholder({
  component,
  blockers,
  reason,
  onNavigateToTab,
}: ComponentFallbackPlaceholderProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-surface-secondary/30 overflow-y-auto">
      <div className="max-w-xl w-full bg-surface border border-border rounded-xl shadow-panel p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-foreground">
                Dynamic Runtime Context Required
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-semibold">
                Preview Fallback
              </span>
            </div>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              {reason}
            </p>
          </div>
        </div>

        {/* Detected Blockers */}
        {blockers.length > 0 && (
          <div className="space-y-2 p-3.5 rounded-lg bg-surface-secondary border border-border text-xs font-mono">
            <div className="flex items-center gap-1.5 text-foreground-muted font-semibold text-[11px] uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-primary" />
              <span>Detected Dynamic Blockers</span>
            </div>
            <ul className="space-y-1.5 pl-1">
              {blockers.map((blocker, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground-secondary">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{blocker}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Schematic Mockup of the Component */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground-muted flex items-center justify-between">
            <span>Structural Blueprint</span>
            <span className="text-[10px] font-normal lowercase text-foreground-muted">
              {component.category}
            </span>
          </div>

          <div className="border border-border/80 rounded-lg p-4 bg-background/50 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  &lt;{component.name} /&gt;
                </span>
              </div>
              <span className="text-[10px] text-foreground-muted">
                {component.props.length} props • {component.childComponents.length} children
              </span>
            </div>

            {/* Simulated props schema */}
            <div className="text-[11px] space-y-1">
              <div className="text-foreground-muted text-[10px] uppercase">Declared Props:</div>
              {component.props.length > 0 ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {component.props.slice(0, 4).map((p) => (
                    <div
                      key={p.name}
                      className="px-2 py-1 rounded bg-surface border border-border/60 flex items-center justify-between text-[10px]"
                    >
                      <span className="text-primary font-semibold truncate">{p.name}</span>
                      <span className="text-foreground-muted truncate max-w-[80px] text-right">
                        {p.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-foreground-muted italic text-[10px]">None</div>
              )}
            </div>

            {/* Child tree */}
            {component.childComponents.length > 0 && (
              <div className="text-[11px] space-y-1 pt-1 border-t border-border/40">
                <div className="text-foreground-muted text-[10px] uppercase">Nested Children:</div>
                <div className="flex flex-wrap gap-1.5">
                  {component.childComponents.map((child) => (
                    <span
                      key={child}
                      className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-foreground-secondary"
                    >
                      &lt;{child} /&gt;
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Direct Action Links */}
        <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onNavigateToTab("code")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-surface hover:bg-surface-secondary border border-border text-foreground transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-primary" />
              <span>Inspect Source</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab("props")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-surface hover:bg-surface-secondary border border-border text-foreground transition-colors"
            >
              <ListTree className="w-3.5 h-3.5 text-primary" />
              <span>View Props ({component.props.length})</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab("deps")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-surface hover:bg-surface-secondary border border-border text-foreground transition-colors"
            >
              <Network className="w-3.5 h-3.5 text-primary" />
              <span>Dependencies</span>
            </button>
          </div>

          <span className="text-[10px] font-mono text-foreground-muted flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            <span>CSP Safe Sandbox Guard</span>
          </span>
        </div>
      </div>
    </div>
  );
}

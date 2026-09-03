"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  GitBranch,
  Layers,
  Cpu,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Loader2,
  Component as ComponentIcon,
  Network,
  Palette,
} from "lucide-react";
import type { RepositoryModel } from "@codexel/shared";
import { ArchitectureCanvas } from "@/components/explorer/ArchitectureCanvas";
import { ComponentExplorer } from "@/components/explorer/ComponentExplorer";
import { DesignSystemExplorer } from "@/components/explorer/design/DesignSystemExplorer";
import { Logo } from "@/components/common/Logo";

export type ActiveExplorerTab = "architecture" | "components" | "design-system";

function ExplorerContent() {
  const searchParams = useSearchParams();
  const repoParam = searchParams.get("repo") || "shadcn-ui/ui";
  const tabParam = searchParams.get("tab");
  const compParam = searchParams.get("component");

  const [activeTab, setActiveTab] = useState<ActiveExplorerTab>(
    tabParam === "design-system"
      ? "design-system"
      : tabParam === "components"
        ? "components"
        : "architecture",
  );
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    compParam || null,
  );

  const [model, setModel] = useState<RepositoryModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/analyze?repo=${encodeURIComponent(repoParam)}`)
      .then((res) => {
        if (!res.ok)
          throw new Error(`Analysis failed with status ${res.status}`);
        return res.json();
      })
      .then((data: RepositoryModel) => {
        if (!isCancelled) {
          setModel(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || "Failed to load repository architecture");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [repoParam]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8 text-center bg-background bg-blueprint-grid">
        <div className="p-4 rounded-full bg-surface border border-border shadow-subtle animate-pulse">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <div className="space-y-1 font-mono">
          <h2 className="text-sm font-bold text-foreground">
            Synthesizing Architecture Graph
          </h2>
          <p className="text-xs text-foreground-muted">
            Resolving AST symbols &amp; classifying layers for {repoParam}...
          </p>
        </div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8 text-center bg-background">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 max-w-md space-y-2">
          <h3 className="font-bold text-sm">Failed to Load Model</h3>
          <p className="text-xs font-mono">
            {error || "Unknown error occurred"}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-surface border border-border text-xs font-mono text-foreground hover:border-border-strong transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    );
  }

  const { metadata, technologyStack, fileSystem, architecture, components } =
    model;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top Application Bar */}
      <header className="h-13 min-h-[52px] border-b border-border bg-surface px-4 flex items-center justify-between gap-4 select-none shrink-0 z-30">
        {/* Left: Brand & Back */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            title="Back to home"
            className="flex items-center gap-1.5 text-xs font-mono text-foreground-secondary hover:text-foreground transition-colors p-1.5 rounded hover:bg-surface-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Logo size="sm" showWordmark={false} href="/" />
            <span className="font-bold text-sm text-foreground tracking-tight font-sans">
              {metadata.owner}/{metadata.name}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-secondary border border-border text-foreground-muted">
              {metadata.commitSha.slice(0, 7)}
            </span>
          </div>
        </div>

        {/* Center: View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-surface-secondary p-1 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("architecture")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
              activeTab === "architecture"
                ? "bg-surface text-foreground font-semibold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Architecture</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("components")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
              activeTab === "components"
                ? "bg-surface text-foreground font-semibold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <ComponentIcon className="w-3.5 h-3.5 text-primary" />
            <span>Components</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "components"
                  ? "bg-primary/10 text-primary"
                  : "bg-surface text-foreground-muted"
              }`}
            >
              {components.totalComponents}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("design-system")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
              activeTab === "design-system"
                ? "bg-surface text-foreground font-semibold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-primary" />
            <span>Design System</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "design-system"
                  ? "bg-primary/10 text-primary"
                  : "bg-surface text-foreground-muted"
              }`}
            >
              {model.designSystem.colorPalette.length > 0
                ? model.designSystem.colorPalette.length
                : model.designSystem.topTailwindClasses.length > 0
                  ? model.designSystem.topTailwindClasses.length
                  : Object.keys(model.designSystem.detectedCssVariables).length}
            </span>
          </button>
        </div>

        {/* Right: High-Level Architecture Stats & Quick Links */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden xl:flex items-center gap-3 text-foreground-muted">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground font-semibold">
                {architecture.layers.length}
              </span>
              <span>layers</span>
            </div>

            <span className="text-border-strong">&bull;</span>

            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-foreground-secondary" />
              <span className="text-foreground font-semibold">
                {fileSystem.totalFiles}
              </span>
              <span>files ({fileSystem.totalLinesOfCode} loc)</span>
            </div>

            <span className="text-border-strong">&bull;</span>

            <div className="flex items-center gap-1.5 text-semantic-green">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Facts</span>
            </div>
          </div>

          <div className="h-4 w-px bg-border hidden xl:block" />

          <Link
            href="/how-to-use"
            className="hidden sm:inline-flex items-center gap-1 text-foreground-secondary hover:text-foreground transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>Guide</span>
          </Link>

          <a
            href={
              metadata.url.startsWith("http")
                ? metadata.url
                : `https://${metadata.url}`
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-surface hover:bg-surface-secondary text-foreground-secondary hover:text-foreground transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Interactive Canvas, Component Explorer, or Design System Explorer */}
      <main className="flex-1 w-full h-full relative overflow-hidden">
        {activeTab === "architecture" ? (
          <ArchitectureCanvas
            model={model}
            onNavigateToComponents={(target) => {
              if (target) {
                const matched =
                  components.components.find((c) => c.id === target) ||
                  components.components.find((c) => c.filePath === target);
                if (matched) {
                  setSelectedComponentId(matched.id);
                }
              }
              setActiveTab("components");
            }}
          />
        ) : activeTab === "components" ? (
          <ComponentExplorer
            inventory={components}
            initialComponentId={selectedComponentId}
            model={model}
          />
        ) : (
          <DesignSystemExplorer designSystem={model.designSystem} />
        )}
      </main>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-xs text-foreground-muted">
          Loading Codexel Architecture Visualizer...
        </div>
      }
    >
      <ExplorerContent />
    </Suspense>
  );
}

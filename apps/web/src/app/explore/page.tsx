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
} from "lucide-react";
import type { RepositoryModel } from "@codexel/shared";
import { ArchitectureCanvas } from "@/components/explorer/ArchitectureCanvas";

function ExplorerContent() {
  const searchParams = useSearchParams();
  const repoParam = searchParams.get("repo") || "shadcn-ui/ui";

  const [model, setModel] = useState<RepositoryModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/analyze?repo=${encodeURIComponent(repoParam)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Analysis failed with status ${res.status}`);
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
          <p className="text-xs font-mono">{error || "Unknown error occurred"}</p>
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

  const { metadata, technologyStack, fileSystem, architecture, components } = model;

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
            <span className="text-primary font-bold text-lg leading-none">◇</span>
            <span className="font-bold text-sm text-foreground tracking-tight font-sans">
              {metadata.owner}/{metadata.name}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-secondary border border-border text-foreground-muted">
              {metadata.commitSha.slice(0, 7)}
            </span>
          </div>
        </div>

        {/* Center: High-Level Architecture Stats */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-foreground-muted">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="text-foreground font-semibold">{architecture.layers.length}</span>
            <span>layers</span>
          </div>

          <span className="text-border-strong">&bull;</span>

          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-foreground-secondary" />
            <span className="text-foreground font-semibold">{fileSystem.totalFiles}</span>
            <span>files ({fileSystem.totalLinesOfCode} loc)</span>
          </div>

          <span className="text-border-strong">&bull;</span>

          <div className="flex items-center gap-1.5 text-semantic-green">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Deterministic Model</span>
          </div>
        </div>

        {/* Right: Quick Links */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <Link
            href="/how-to-use"
            className="hidden sm:inline-flex items-center gap-1 text-foreground-secondary hover:text-foreground transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>Guide</span>
          </Link>

          <a
            href={metadata.url.startsWith("http") ? metadata.url : `https://${metadata.url}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-surface hover:bg-surface-secondary text-foreground-secondary hover:text-foreground transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Interactive Canvas Area */}
      <main className="flex-1 w-full h-full relative overflow-hidden">
        <ArchitectureCanvas model={model} />
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

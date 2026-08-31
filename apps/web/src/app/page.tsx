"use client";

import React, { useState } from "react";
import {
  FolderUp,
  ArrowRight,
  ExternalLink,
  Layers,
  Component as ComponentIcon,
  Palette,
  Code2,
  Database,
  Shield,
  Server,
  Layout,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("github.com/shadcn-ui/ui");
  const [selectedNode, setSelectedNode] = useState<{
    name: string;
    path: string;
    type: string;
    category: string;
    dependencies: number;
    usedBy: string;
  }>({
    name: "Dashboard",
    path: "src/app/dashboard",
    type: "Route / Feature",
    category: "Frontend",
    dependencies: 12,
    usedBy: "4 modules",
  });

  return (
    <div className="min-h-screen bg-background text-foreground bg-blueprint-grid">
      {/* Top Header / Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2 text-foreground font-semibold text-lg tracking-tight">
              <span className="text-primary font-bold text-xl leading-none">◇</span>
              <span>codexel</span>
            </a>
            <span className="hidden sm:inline-block text-[11px] font-mono text-foreground-muted uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-surface-secondary">
              Developer Workspace
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm text-foreground-secondary font-medium">
            <a href="#architecture" className="hover:text-foreground transition-colors">
              Architecture
            </a>
            <a href="#components" className="hover:text-foreground transition-colors">
              Components
            </a>
            <a href="#design-system" className="hover:text-foreground transition-colors">
              Design System
            </a>
            <a href="#source" className="hover:text-foreground transition-colors">
              Source
            </a>
            <a
              href="https://github.com/Abhaynegi1/Codexel"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-foreground-secondary hover:text-foreground transition-colors"
            >
              GitHub <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24 space-y-20">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono text-foreground-secondary bg-surface-secondary border border-border">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Deterministic Blueprint &bull; No Hallucinations</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
            Understand any codebase.
          </h1>

          <p className="text-lg text-foreground-secondary leading-relaxed max-w-2xl mx-auto">
            Visualize architecture, explore components, and uncover the design system behind any repository.
          </p>

          {/* Primary Repository Interaction Card */}
          <div className="pt-4 max-w-2xl mx-auto space-y-3">
            <div className="technical-panel p-4 rounded-lg space-y-3 shadow-subtle text-left">
              <div className="flex items-center justify-between text-xs text-foreground-muted font-mono">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>Paste a GitHub repository URL</span>
                </div>
                <span>Public or cloneable Git URL</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="github.com/user/project"
                    className="w-full bg-surface-secondary text-foreground text-sm font-mono px-3.5 py-2.5 rounded-md border border-border focus:border-border-strong focus:outline-none focus:bg-surface transition-colors"
                  />
                </div>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Folder Drop Secondary Option */}
            <div className="flex items-center justify-center gap-2 text-xs text-foreground-muted font-mono">
              <span>or</span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-border-strong bg-surface hover:bg-surface-secondary text-foreground-secondary transition-colors"
              >
                <FolderUp className="w-3.5 h-3.5 text-primary" />
                <span>Drop a repository folder</span>
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-foreground-muted font-mono">
              <span>Sample repos:</span>
              {["shadcn-ui/ui", "vercel/next.js", "tailwindlabs/tailwindcss"].map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setRepoUrl(`github.com/${slug}`)}
                  className="px-2 py-0.5 rounded bg-surface border border-border text-foreground-secondary hover:border-border-strong transition-colors"
                >
                  {slug}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Blueprint Visual Preview: Architecture Map & Explorer View */}
        <section id="architecture" className="space-y-3">
          <div className="flex items-center justify-between text-xs text-foreground-muted font-mono px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-semantic-green" />
              <span>LIVE BLUEPRINT PREVIEW</span>
            </div>
            <span>INTERACTIVE ARCHITECTURE CANVAS</span>
          </div>

          <div className="technical-panel rounded-lg overflow-hidden">
            {/* Repository Context Header */}
            <div className="px-5 py-3 border-b border-border bg-surface-secondary flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">◇</span>
                <span className="font-semibold text-foreground">taxonomy</span>
                <span className="text-foreground-muted font-mono">Next.js &bull; TypeScript &bull; Tailwind &bull; PostgreSQL</span>
              </div>
              <div className="flex items-center gap-4 text-foreground-secondary font-mono text-[11px]">
                <span>342 files</span>
                <span>247 components</span>
                <span>34 routes</span>
                <span>48 dependencies</span>
              </div>
            </div>

            {/* Canvas Area: Blueprint DAG with Node Details Side Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] bg-surface">
              {/* Main Blueprint Canvas */}
              <div className="lg:col-span-8 p-8 flex flex-col justify-between border-r border-border relative bg-blueprint-grid">
                <div className="flex items-center justify-between text-xs font-mono text-foreground-muted">
                  <span>Architecture Hierarchy (DAG)</span>
                  <span className="text-[11px] text-foreground-secondary">Click node to inspect metadata</span>
                </div>

                {/* Simulated Architecture Nodes Hierarchy */}
                <div className="py-6 flex flex-col items-center space-y-6">
                  {/* Layer 1: Root Web App */}
                  <div
                    onClick={() =>
                      setSelectedNode({
                        name: "Web App",
                        path: "src/app",
                        type: "Application Root",
                        category: "Application",
                        dependencies: 48,
                        usedBy: "Entry Module",
                      })
                    }
                    className={`px-5 py-2.5 rounded-md border text-center cursor-pointer transition-all ${
                      selectedNode.name === "Web App"
                        ? "border-primary bg-primary-soft text-primary-dark font-semibold shadow-subtle"
                        : "border-border bg-surface hover:border-border-strong text-foreground"
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Root Application</div>
                    <div className="text-sm font-semibold">Web App</div>
                  </div>

                  {/* Connecting Line */}
                  <div className="w-px h-6 bg-border-strong" />

                  {/* Layer 2: Frontend & Feature Nodes */}
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {[
                      { name: "Dashboard", path: "src/app/dashboard", category: "Frontend", color: "text-semantic-blue" },
                      { name: "Auth", path: "src/lib/auth", category: "Authentication", color: "text-semantic-purple" },
                      { name: "Marketing", path: "src/app/(marketing)", category: "Frontend", color: "text-semantic-blue" },
                    ].map((node) => (
                      <div
                        key={node.name}
                        onClick={() =>
                          setSelectedNode({
                            name: node.name,
                            path: node.path,
                            type: "Route / Feature",
                            category: node.category,
                            dependencies: node.name === "Dashboard" ? 12 : 6,
                            usedBy: "4 modules",
                          })
                        }
                        className={`px-4 py-2 rounded-md border cursor-pointer transition-all ${
                          selectedNode.name === node.name
                            ? "border-primary bg-primary-soft text-primary-dark font-medium shadow-subtle"
                            : "border-border bg-surface hover:border-border-strong text-foreground"
                        }`}
                      >
                        <div className={`text-[10px] font-mono ${node.color}`}>{node.category}</div>
                        <div className="text-xs font-semibold">{node.name}</div>
                      </div>
                    ))}
                  </div>

                  {/* Connecting Line */}
                  <div className="w-px h-6 bg-border-strong" />

                  {/* Layer 3: Shared UI Primitives */}
                  <div
                    onClick={() =>
                      setSelectedNode({
                        name: "UI Components",
                        path: "src/components/ui",
                        type: "Shared Primitives",
                        category: "UI Primitives",
                        dependencies: 8,
                        usedBy: "38 components",
                      })
                    }
                    className={`px-5 py-2.5 rounded-md border text-center cursor-pointer transition-all ${
                      selectedNode.name === "UI Components"
                        ? "border-primary bg-primary-soft text-primary-dark font-semibold shadow-subtle"
                        : "border-border bg-surface hover:border-border-strong text-foreground"
                    }`}
                  >
                    <div className="text-[10px] font-mono text-foreground-muted">Design System Primitives</div>
                    <div className="text-xs font-semibold">UI Components</div>
                  </div>

                  {/* Connecting Line */}
                  <div className="w-px h-6 bg-border-strong" />

                  {/* Layer 4: API & Server */}
                  <div className="flex items-center gap-6">
                    <div
                      onClick={() =>
                        setSelectedNode({
                          name: "API Layer",
                          path: "src/app/api",
                          type: "Backend / Routes",
                          category: "Backend/API",
                          dependencies: 14,
                          usedBy: "Client Fetchers",
                        })
                      }
                      className={`px-4 py-2 rounded-md border cursor-pointer transition-all ${
                        selectedNode.name === "API Layer"
                          ? "border-primary bg-primary-soft text-primary-dark font-semibold shadow-subtle"
                          : "border-border bg-surface hover:border-border-strong text-foreground"
                      }`}
                    >
                      <div className="text-[10px] font-mono text-semantic-green">Backend/API</div>
                      <div className="text-xs font-semibold">API Layer</div>
                    </div>

                    <div className="w-4 h-px bg-border-strong" />

                    {/* Layer 5: Database */}
                    <div
                      onClick={() =>
                        setSelectedNode({
                          name: "Database",
                          path: "src/database/schema.ts",
                          type: "Data Layer",
                          category: "Database",
                          dependencies: 3,
                          usedBy: "API Layer",
                        })
                      }
                      className={`px-4 py-2 rounded-md border cursor-pointer transition-all ${
                        selectedNode.name === "Database"
                          ? "border-primary bg-primary-soft text-primary-dark font-semibold shadow-subtle"
                          : "border-border bg-surface hover:border-border-strong text-foreground"
                      }`}
                    >
                      <div className="text-[10px] font-mono text-primary">Database</div>
                      <div className="text-xs font-semibold">PostgreSQL (Drizzle)</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-foreground-muted font-mono pt-4 border-t border-border">
                  <span>Semantic Colors: Blue = Frontend &bull; Green = API &bull; Orange = App/DB &bull; Purple = Auth</span>
                  <span>100% Deterministic AST</span>
                </div>
              </div>

              {/* Architecture Details Side Panel */}
              <div className="lg:col-span-4 p-6 bg-surface-secondary flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  <div className="text-xs font-mono text-foreground-muted uppercase tracking-wider">
                    Node Specification
                  </div>

                  <div className="space-y-1">
                    <div className="text-xl font-bold text-foreground flex items-center justify-between">
                      <span>{selectedNode.name}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-border text-foreground-secondary">
                        {selectedNode.category}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-foreground-muted truncate">{selectedNode.path}</div>
                  </div>

                  <div className="space-y-3 pt-2 text-xs">
                    <div className="p-3 rounded-md bg-surface border border-border space-y-1">
                      <div className="text-foreground-muted">Classification Type</div>
                      <div className="font-semibold text-foreground">{selectedNode.type}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-md bg-surface border border-border space-y-1">
                        <div className="text-foreground-muted">Dependencies</div>
                        <div className="font-semibold text-foreground">{selectedNode.dependencies} modules</div>
                      </div>
                      <div className="p-3 rounded-md bg-surface border border-border space-y-1">
                        <div className="text-foreground-muted">Used by</div>
                        <div className="font-semibold text-foreground">{selectedNode.usedBy}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                  <button
                    type="button"
                    className="w-full py-2 px-3 rounded-md bg-surface border border-border hover:border-border-strong text-foreground text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Code2 className="w-3.5 h-3.5 text-primary" />
                    <span>View Node Source</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Navigation / The Four Core Concepts */}
        <section id="features" className="space-y-8 pt-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              A visual developer workspace.
            </h2>
            <p className="text-sm text-foreground-secondary">
              Everything in Codexel is connected directly to verified source code facts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Concept 1: Architecture */}
            <div className="technical-panel p-5 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded-md bg-surface-secondary border border-border flex items-center justify-center text-primary">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-foreground text-base">Architecture</h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                See how everything connects. Explore boundaries, feature modules, API routes, and data pipelines.
              </p>
            </div>

            {/* Concept 2: Components */}
            <div id="components" className="technical-panel p-5 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded-md bg-surface-secondary border border-border flex items-center justify-center text-semantic-blue">
                <ComponentIcon className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-foreground text-base">Components</h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Explore the UI hidden inside the repository. Detect React components, props interfaces, and render hierarchies.
              </p>
            </div>

            {/* Concept 3: Design System */}
            <div id="design-system" className="technical-panel p-5 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded-md bg-surface-secondary border border-border flex items-center justify-center text-primary">
                <Palette className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-foreground text-base">Design System</h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Discover colors, typography and spacing extracted from CSS variables, Tailwind configurations, and stylesheets.
              </p>
            </div>

            {/* Concept 4: Source */}
            <div id="source" className="technical-panel p-5 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded-md bg-surface-secondary border border-border flex items-center justify-center text-semantic-green">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-foreground text-base">Source</h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Trace every insight back to the actual code. Inspect line ranges, imports, and complete dependency closures.
              </p>
            </div>
          </div>
        </section>

        {/* Component Explorer & Design System Blueprint Showcase */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Component Card Preview */}
          <div className="lg:col-span-7 technical-panel rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-foreground-muted border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ComponentIcon className="w-3.5 h-3.5 text-semantic-blue" />
                <span className="font-semibold text-foreground">AUTOMATIC COMPONENT CATALOG</span>
              </div>
              <span>Button.tsx</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-md bg-surface-secondary border border-border space-y-3">
                <div className="text-xs font-semibold text-foreground">Button Primitive</div>
                <div className="py-3 flex items-center gap-2">
                  <button type="button" className="px-3.5 py-1.5 rounded-md bg-primary text-white text-xs font-medium">
                    Continue
                  </button>
                  <button type="button" className="px-3.5 py-1.5 rounded-md border border-border bg-surface text-xs font-medium">
                    Ghost
                  </button>
                </div>
                <div className="text-[11px] font-mono text-foreground-muted">6 variants &bull; 3 sizes</div>
              </div>

              <div className="p-4 rounded-md bg-surface-secondary border border-border space-y-3">
                <div className="text-xs font-semibold text-foreground">1-Click Closure Bundle</div>
                <div className="space-y-1 text-[11px] font-mono text-foreground-secondary">
                  <div className="flex items-center gap-1.5 text-semantic-green">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Button.tsx</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-semantic-green">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>buttonVariants.ts</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-semantic-green">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>utils.ts (cn helper)</span>
                  </div>
                </div>
                <div className="text-[11px] text-primary font-mono font-medium">[ Copy Component Bundle ]</div>
              </div>
            </div>
          </div>

          {/* Design System Tokens Preview */}
          <div className="lg:col-span-5 technical-panel rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-foreground-muted border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-foreground">EXTRACTED DESIGN SYSTEM</span>
              </div>
              <span>tokens.json</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-md bg-surface-secondary border border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: "#F59E0B" }} />
                  <div>
                    <div className="font-semibold text-foreground">Primary Accent</div>
                    <div className="text-[10px] font-mono text-foreground-muted">--primary</div>
                  </div>
                </div>
                <span className="font-mono text-xs text-foreground-secondary">#F59E0B</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-md bg-surface-secondary border border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: "#F8F7F3" }} />
                  <div>
                    <div className="font-semibold text-foreground">Editorial Background</div>
                    <div className="text-[10px] font-mono text-foreground-muted">--bg-color</div>
                  </div>
                </div>
                <span className="font-mono text-xs text-foreground-secondary">#F8F7F3</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-md bg-surface-secondary border border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: "#171717" }} />
                  <div>
                    <div className="font-semibold text-foreground">Text Primary</div>
                    <div className="text-[10px] font-mono text-foreground-muted">--text-primary</div>
                  </div>
                </div>
                <span className="font-mono text-xs text-foreground-secondary">#171717</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Technical Editorial Footer */}
      <footer className="border-t border-border py-8 bg-surface">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted font-mono">
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold">◇</span>
            <span className="text-foreground font-medium">codexel</span>
            <span>&bull; Visual Developer Workspace</span>
          </div>
          <div>Open a codebase and look inside.</div>
        </div>
      </footer>
    </div>
  );
}

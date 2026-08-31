"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Layers,
  Component as ComponentIcon,
  Palette,
  Code2,
  CheckCircle2,
  ShieldCheck,
  GitBranch,
} from "lucide-react";

export default function HowToUsePage() {
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
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground font-semibold text-lg tracking-tight">
            <span className="text-primary font-bold text-xl leading-none">◇</span>
            <span>codexel</span>
          </Link>

          <div className="flex items-center gap-5 text-sm text-foreground-secondary font-medium">
            <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Explorer</span>
            </Link>
            <a
              href="https://github.com/Abhaynegi1/Codexel"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              GitHub <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 pt-12 pb-24 space-y-16">
        {/* Header */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono text-foreground-secondary bg-surface-secondary border border-border">
            <ShieldCheck className="w-3.5 h-3.5 text-semantic-green" />
            <span>Developer Guide &bull; Architecture & Features</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
            How to use Codexel.
          </h1>

          <p className="text-base sm:text-lg text-foreground-secondary leading-relaxed max-w-3xl">
            Codexel transforms unfamiliar repositories into structured, visual intelligence. Below is an interactive
            demonstration of the architecture canvas and an explanation of the core analysis pipeline.
          </p>
        </section>

        {/* Live Blueprint Architecture Canvas Interactive Showcase */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs text-foreground-muted font-mono px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-semantic-green" />
              <span>INTERACTIVE BLUEPRINT DEMONSTRATION</span>
            </div>
            <span>CLICK NODES TO INSPECT</span>
          </div>

          <div className="technical-panel rounded-lg overflow-hidden shadow-panel">
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

        {/* Workflow Steps */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight border-b border-border pb-2">
            The 3-Step Workflow
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="technical-panel p-5 rounded-lg space-y-2.5">
              <div className="text-xs font-mono text-primary font-semibold">STEP 01</div>
              <h3 className="font-semibold text-foreground text-sm">Provide Repository</h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Paste any public GitHub repository URL or drag-and-drop a local project folder directly onto the canvas.
              </p>
            </div>

            <div className="technical-panel p-5 rounded-lg space-y-2.5">
              <div className="text-xs font-mono text-primary font-semibold">STEP 02</div>
              <h3 className="font-semibold text-foreground text-sm">Deterministic Parsing</h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                The engine inspects ASTs, traverses module imports, and catalogs design tokens. Zero code execution.
              </p>
            </div>

            <div className="technical-panel p-5 rounded-lg space-y-2.5">
              <div className="text-xs font-mono text-primary font-semibold">STEP 03</div>
              <h3 className="font-semibold text-foreground text-sm">Explore & Reuse</h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Navigate the architecture graph, view component props, and copy full transitive dependency closures.
              </p>
            </div>
          </div>
        </section>

        {/* The 4 Core Exploration Pillars */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight border-b border-border pb-2">
            The Four Core Pillars
          </h2>

          <div className="space-y-4">
            {/* Pillar 1 */}
            <div className="technical-panel p-6 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-surface-secondary border border-border flex items-center justify-center text-primary">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">1. Architecture Blueprint</h3>
                  <div className="text-xs font-mono text-foreground-muted">Interactive Module DAG & Boundaries</div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
                Instead of guessing folder structures, Codexel maps your codebase into a directional graph. It identifies
                application entry points, frontend views, backend routes, and database models. Nodes are classified with
                verifiable evidence directly linking to source files.
              </p>
              <div className="p-3 rounded-md bg-surface-secondary border border-border text-xs font-mono text-foreground-muted flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-primary" />
                <span>Semantic Colors: Blue = Frontend &bull; Green = API &bull; Orange = Root & Database &bull; Purple = Auth</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="technical-panel p-6 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-surface-secondary border border-border flex items-center justify-center text-semantic-blue">
                  <ComponentIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">2. Component Explorer</h3>
                  <div className="text-xs font-mono text-foreground-muted">Auto-generated Component Inventory</div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
                Codexel automatically inventories all React/UI components. For each component, you can inspect its exported
                props interface, child component render tree, and which pages or features import it.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-md bg-surface-secondary border border-border space-y-1.5">
                  <div className="text-xs font-semibold text-foreground">Props Inspection</div>
                  <div className="text-[11px] font-mono text-foreground-muted">
                    variant, size, disabled, asChild, children
                  </div>
                </div>
                <div className="p-3 rounded-md bg-surface-secondary border border-border space-y-1.5">
                  <div className="text-xs font-semibold text-foreground">1-Click Closure Copy</div>
                  <div className="text-[11px] font-mono text-foreground-muted">
                    Copies component + helper utils + required npm packages
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="technical-panel p-6 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-surface-secondary border border-border flex items-center justify-center text-primary">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">3. Design System Extraction</h3>
                  <div className="text-xs font-mono text-foreground-muted">Tokens, CSS Variables, Typography & Colors</div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
                Underlying design tokens are extracted directly from repository stylesheets, `:root` CSS variables, and
                Tailwind configuration files. View the extracted color palette swatches, font families, line heights, and
                most recurring utility classes.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="technical-panel p-6 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-surface-secondary border border-border flex items-center justify-center text-semantic-green">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">4. Source Traceability</h3>
                  <div className="text-xs font-mono text-foreground-muted">Exact File & Line-Range Verification</div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
                Nothing is hallucinated. Every node, dependency, or component in Codexel can be clicked to reveal its exact
                underlying file path, line numbers, and original source implementation.
              </p>
            </div>
          </div>
        </section>

        {/* Component Catalog & Design Token Previews */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

        {/* Security & Sandboxing */}
        <section className="technical-panel p-6 rounded-lg space-y-3 border-l-4 border-l-primary">
          <h2 className="font-bold text-foreground text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Security & Privacy Axiom: Analyze, Never Execute</span>
          </h2>
          <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
            Codexel treats every repository as untrusted input. It never runs arbitrary scripts (`npm install`, build commands,
            or execution hooks). Repositories are analyzed statically using Abstract Syntax Tree (AST) parsing and shallow
            ephemeral workspaces that are purged immediately upon model generation.
          </p>
        </section>

        {/* Bottom CTA */}
        <div className="text-center pt-6 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-colors shadow-subtle"
          >
            <span>Launch Explorer</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="text-xs font-mono text-foreground-muted">
            Ready to explore? Paste any GitHub repository URL.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-surface">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted font-mono">
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

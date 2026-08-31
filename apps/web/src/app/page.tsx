import React from "react";
import {
  Layers,
  Component,
  Palette,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Search,
  ExternalLink,
  Code2,
  Cpu,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground bg-grid-pattern selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-purple-600/20 via-indigo-500/20 to-transparent blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute top-[45%] -right-40 w-[500px] h-[500px] bg-indigo-600/10 blur-[130px] rounded-full" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/25 border border-purple-400/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
              Codexel
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Phase 0
              </span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-white transition-colors">
              Architecture
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Components
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Design System
            </a>
            <a
              href="https://github.com/Abhaynegi1/Codexel"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              GitHub <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-28">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-500/30 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Deterministic Static Analysis &bull; Zero Hallucinations</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Turn any codebase into an{" "}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500 bg-clip-text text-transparent">
              explorable visual universe.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Understand unfamiliar repositories instantly. Explore architecture maps, catalog UI components,
            inspect design tokens, and trace dependency closures — grounded directly in verified source code.
          </p>

          {/* Repository Input Form */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="glass-panel-glow p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-2 shadow-2xl">
              <div className="flex items-center gap-3 px-3 w-full text-muted-foreground">
                <Search className="w-5 h-5 text-purple-400 shrink-0" />
                <input
                  type="text"
                  placeholder="https://github.com/owner/repository"
                  defaultValue="https://github.com/shadcn-ui/ui"
                  className="w-full bg-transparent text-white placeholder-muted-foreground/60 text-sm sm:text-base outline-none py-2 font-mono"
                  readOnly
                />
              </div>
              <button
                type="button"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 shrink-0 group cursor-pointer"
              >
                <span>Analyze Repo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs text-muted-foreground">
              <span>Try analyzing:</span>
              <span className="px-2 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground border border-border/60 font-mono">
                shadcn-ui/ui
              </span>
              <span className="px-2 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground border border-border/60 font-mono">
                vercel/next.js
              </span>
              <span className="px-2 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground border border-border/60 font-mono">
                tailwindlabs/tailwindcss
              </span>
            </div>
          </div>
        </div>

        {/* Explorer Mockup Canvas Preview */}
        <div className="mt-16 relative">
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-purple-950/40">
            {/* Mockup Window Header */}
            <div className="px-5 py-3 border-b border-border/60 bg-muted/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-3 font-mono text-muted-foreground text-[11px]">
                  codexel.explorer &bull; taxonomy @ commit 9f82ab1
                </span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground font-mono">
                <span>116 Files</span>
                <span>34 Components</span>
                <span className="text-purple-400 font-semibold">100% Verified Facts</span>
              </div>
            </div>

            {/* Mockup Body: 3-column interactive layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] bg-card/60">
              {/* Left Sidebar: Layers */}
              <div className="md:col-span-3 border-r border-border/60 p-4 space-y-4">
                <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  Architecture Layers
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-200 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" /> UI Primitives
                    </span>
                    <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded">18</span>
                  </div>
                  <div className="p-2.5 rounded-lg hover:bg-muted/40 transition-colors text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Component className="w-4 h-4 text-indigo-400" /> Domain Features
                    </span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">12</span>
                  </div>
                  <div className="p-2.5 rounded-lg hover:bg-muted/40 transition-colors text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-blue-400" /> API & Server
                    </span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">6</span>
                  </div>
                  <div className="p-2.5 rounded-lg hover:bg-muted/40 transition-colors text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-400" /> Infrastructure / DB
                    </span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">4</span>
                  </div>
                </div>
              </div>

              {/* Center Canvas: Simulated Architecture Graph */}
              <div className="md:col-span-6 p-6 flex flex-col justify-between relative bg-background/30">
                <div className="text-xs text-muted-foreground flex items-center justify-between font-mono">
                  <span>Interactive Dependency Graph</span>
                  <span className="text-emerald-400">● DAG Synced</span>
                </div>

                <div className="flex items-center justify-around py-8">
                  {/* Node 1 */}
                  <div className="p-3 rounded-xl bg-card border border-purple-500/40 shadow-lg text-center space-y-1">
                    <div className="text-[10px] text-purple-400 font-mono">page.tsx</div>
                    <div className="text-xs font-semibold text-white">DashboardPage</div>
                  </div>

                  <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500" />

                  {/* Node 2 */}
                  <div className="p-3 rounded-xl bg-card border border-indigo-500/40 shadow-lg text-center space-y-1">
                    <div className="text-[10px] text-indigo-400 font-mono">PostItem.tsx</div>
                    <div className="text-xs font-semibold text-white">PostItem</div>
                  </div>

                  <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500" />

                  {/* Node 3 */}
                  <div className="p-3 rounded-xl bg-card border border-emerald-500/40 shadow-lg text-center space-y-1">
                    <div className="text-[10px] text-emerald-400 font-mono">button.tsx</div>
                    <div className="text-xs font-semibold text-white">Button</div>
                  </div>
                </div>

                <div className="text-center text-[11px] text-muted-foreground font-mono bg-muted/30 py-1.5 rounded-lg border border-border/40">
                  Transitive closure resolved: 1 component &bull; 2 helper files &bull; 4 npm packages
                </div>
              </div>

              {/* Right Panel: Extracted Design Tokens */}
              <div className="md:col-span-3 border-l border-border/60 p-4 space-y-4">
                <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  Design Tokens
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-card border border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-purple-500 border border-white/20" />
                      <span className="font-mono text-[11px]">--primary</span>
                    </div>
                    <span className="text-muted-foreground text-[10px] font-mono">#7c3aed</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-card border border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-zinc-900 border border-white/20" />
                      <span className="font-mono text-[11px]">--background</span>
                    </div>
                    <span className="text-muted-foreground text-[10px] font-mono">#09090b</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-card border border-border/60">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-400" />
                      <span className="text-[11px]">Border Radius</span>
                    </div>
                    <span className="text-muted-foreground text-[10px] font-mono">0.75rem</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <section id="features" className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Architecture Visualization</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Explore structural boundaries, feature domains, server routes, and data flows in an interactive
              React Flow graph canvas.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Component className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Component Inventory & Closure</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automatically detect React components, inspect props, see usage hierarchies, and extract the complete
              dependency closure for 1-click component reuse.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Extracted Design Intelligence</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automatically harvest colors, typography ladders, spacing tokens, CSS variables, and top Tailwind
              classes from actual repository stylesheets.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-card/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-purple-400" />
            <span>Codexel &bull; Phase 0 Foundation Active</span>
          </div>
          <div>Turn any codebase into something you can see, understand, and reuse.</div>
        </div>
      </footer>
    </div>
  );
}

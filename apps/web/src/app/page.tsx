"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderUp, ArrowRight, ExternalLink, BookOpen } from "lucide-react";
import { Logo } from "@/components/common/Logo";

export default function HomePage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("github.com/shadcn-ui/ui");

  const handleExplore = (targetUrl?: string) => {
    const urlToExplore = targetUrl || repoUrl;
    if (urlToExplore.trim()) {
      router.push(`/explore?repo=${encodeURIComponent(urlToExplore.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-blueprint-grid flex flex-col justify-between">
      {/* Minimal Top Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo href="/" size="md" />

          <nav className="flex items-center gap-6 text-sm text-foreground-secondary font-medium">
            <Link
              href="/how-to-use"
              className="hover:text-foreground transition-colors"
            >
              How to Use
            </Link>
            <a
              href="https://github.com/Abhaynegi1/Codexel"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              GitHub <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </nav>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="max-w-3xl mx-auto px-6 py-20 my-auto text-center space-y-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono text-foreground-secondary bg-surface-secondary border border-border">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>Deterministic Blueprint &bull; No Hallucinations</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
            Understand any codebase.
          </h1>

          <p className="text-lg text-foreground-secondary leading-relaxed max-w-xl mx-auto">
            Visualize architecture, explore components, and uncover the design
            system behind any repository.
          </p>
        </div>

        {/* Primary Repository Interaction Card */}
        <div className="pt-2 max-w-2xl mx-auto space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExplore();
            }}
            className="technical-panel p-4 rounded-lg space-y-3 shadow-subtle text-left"
          >
            <div className="flex items-center justify-between text-xs text-foreground-muted font-mono">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-foreground"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
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
                type="submit"
                className="px-5 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Explore</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Folder Drop Secondary Option */}
          <div className="flex items-center justify-center gap-2 text-xs text-foreground-muted font-mono">
            <span>or</span>
            <button
              type="button"
              onClick={() => handleExplore("local/project")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-border-strong bg-surface hover:bg-surface-secondary text-foreground-secondary transition-colors"
            >
              <FolderUp className="w-3.5 h-3.5 text-primary" />
              <span>Explore local workspace sample</span>
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-foreground-muted font-mono">
            <span>Sample repos:</span>
            {["shadcn-ui/ui", "vercel/next.js", "tailwindlabs/tailwindcss"].map(
              (slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => {
                    const u = `github.com/${slug}`;
                    setRepoUrl(u);
                    handleExplore(u);
                  }}
                  className="px-2 py-0.5 rounded bg-surface border border-border text-foreground-secondary hover:border-border-strong hover:text-foreground transition-colors"
                >
                  {slug}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Clean Secondary Prompt */}
        <div className="pt-6">
          <Link
            href="/how-to-use"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface border border-border hover:border-border-strong text-xs font-mono text-foreground-secondary hover:text-foreground transition-all shadow-subtle"
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>
              See live architecture canvas & blueprint guide in How to Use
              &rarr;
            </span>
          </Link>
        </div>
      </main>

      {/* Technical Editorial Footer */}
      <footer className="border-t border-border py-8 bg-surface">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted font-mono">
          <div className="flex items-center gap-2">
            <Logo href="/" size="sm" showWordmark={true} />
            <span>&bull; Visual Developer Workspace</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/how-to-use"
              className="hover:text-foreground transition-colors"
            >
              How to Use
            </Link>
            <span>&bull;</span>
            <div>Open a codebase and look inside.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

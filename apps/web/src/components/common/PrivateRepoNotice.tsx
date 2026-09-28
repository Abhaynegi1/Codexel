"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  Lock,
  FolderUp,
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";

interface PrivateRepoNoticeProps {
  repoUrl?: string;
  onOpenLocalFolder?: () => void;
}

export function PrivateRepoNotice({
  repoUrl,
  onOpenLocalFolder,
}: PrivateRepoNoticeProps) {
  const [copiedCli, setCopiedCli] = useState(false);

  const cleanRepoName = repoUrl
    ? repoUrl.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "")
    : "this repository";

  const cliCommand = "npx @codexel/cli analyze .";

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="flex-1 min-h-[600px] w-full flex flex-col items-center justify-center p-6 text-center bg-background bg-blueprint-grid select-none animate-in fade-in duration-300">
      <div className="max-w-lg w-full flex flex-col items-center space-y-6">
        {/* Animated Cat Model with Lock Overlay */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-full h-full">
            <DotLottieReact
              src="/animations/loader.lottie"
              loop
              autoplay
              className="w-full h-full"
            />
          </div>

          {/* Floating Security Badge */}
          <div className="absolute bottom-2 right-6 sm:right-8 bg-amber-500 text-white dark:text-zinc-950 p-2 rounded-xl shadow-lg border-2 border-background animate-bounce duration-1000 flex items-center justify-center">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* Status Header */}
        <div className="space-y-3 font-mono">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Private Repository Restricted</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight font-sans">
            Cannot Access Private Repository
          </h2>

          <p className="text-xs text-foreground-muted max-w-md mx-auto leading-relaxed font-sans">
            <span className="font-mono text-foreground font-semibold">
              {cleanRepoName}
            </span>{" "}
            is private or requires GitHub authentication. Codexel only accesses
            public open-source repositories over remote URLs.
          </p>
        </div>

        {/* Action Panel: Safe Local Alternatives */}
        <div className="w-full bg-surface/80 dark:bg-surface/50 border border-border rounded-xl p-4 sm:p-5 text-left space-y-4 shadow-subtle backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-mono text-foreground-secondary">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-foreground">
              Analyze Privately With Zero Cloud Uploads
            </span>
          </div>

          <p className="text-xs text-foreground-muted leading-relaxed font-sans">
            You can analyze this private codebase safely on your local machine.
            Your code never leaves your browser:
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            {onOpenLocalFolder && (
              <button
                type="button"
                onClick={onOpenLocalFolder}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-pressed text-primary-foreground font-semibold text-xs transition-colors shadow-xs"
              >
                <FolderUp className="w-4 h-4" />
                <span>Open Local Project Folder</span>
              </button>
            )}

            <Link
              href="/explore?repo=shadcn-ui/ui"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-surface-secondary hover:bg-surface text-foreground-secondary hover:text-foreground border border-border text-xs font-mono transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Try Sample Repo</span>
            </Link>
          </div>

          {/* CLI Alternative Box */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono bg-background/50 p-2.5 rounded-lg border">
            <div className="flex items-center gap-2 overflow-x-auto text-foreground-secondary">
              <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
              <code className="text-[11px] select-all">{cliCommand}</code>
            </div>
            <button
              type="button"
              onClick={handleCopyCli}
              title="Copy CLI command"
              className="ml-2 p-1.5 rounded hover:bg-surface text-foreground-muted hover:text-foreground transition-colors shrink-0"
            >
              {copiedCli ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

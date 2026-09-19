"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  FileDown,
  Copy,
  Check,
  FileText,
  Layers,
  Component as ComponentIcon,
  Palette,
  Network,
  Route,
  Sparkles,
  CheckSquare,
  Square,
  Eye,
  Sliders,
} from "lucide-react";
import type { RepositoryModel } from "@codexel/shared";
import {
  generateRepositoryMarkdown,
  type ExportSectionsConfig,
  DEFAULT_EXPORT_SECTIONS,
} from "@/lib/export-markdown";
import { CodeViewer } from "../CodeViewer";

interface ExportMarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: RepositoryModel;
}

export function ExportMarkdownModal({
  isOpen,
  onClose,
  model,
}: ExportMarkdownModalProps) {
  const [sections, setSections] = useState<ExportSectionsConfig>(
    DEFAULT_EXPORT_SECTIONS,
  );
  const [activeTab, setActiveTab] = useState<"configure" | "preview">(
    "configure",
  );
  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Generate markdown content based on currently selected sections
  const markdownContent = useMemo(() => {
    return generateRepositoryMarkdown(model, sections);
  }, [model, sections]);

  if (!isOpen) return null;

  const toggleSection = (key: keyof ExportSectionsConfig) => {
    setSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAll = () => {
    setSections({
      overview: true,
      aiSummary: true,
      architecture: true,
      components: true,
      designSystem: true,
      routes: true,
      dependencyGraph: true,
    });
  };

  const handleDeselectAll = () => {
    setSections({
      overview: false,
      aiSummary: false,
      architecture: false,
      components: false,
      designSystem: false,
      routes: false,
      dependencyGraph: false,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${model.metadata.name.toLowerCase()}-codexel-spec.md`;
    const blob = new Blob([markdownContent], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedCount = Object.values(sections).filter(Boolean).length;

  const sectionOptions: Array<{
    key: keyof ExportSectionsConfig;
    title: string;
    description: string;
    icon: React.ElementType;
    badge: string;
  }> = [
    {
      key: "overview",
      title: "Repository Overview & Tech Stack",
      description:
        "Project metadata, language distribution, detected frameworks & libraries",
      icon: FileText,
      badge: `${model.technologyStack.primaryLanguage} • ${model.fileSystem.totalFiles} files`,
    },
    {
      key: "aiSummary",
      title: "AI Architectural Synthesis",
      description:
        "High-level summary of architecture roles, verified boundaries, and system design",
      icon: Sparkles,
      badge: "Grounded Summary",
    },
    {
      key: "architecture",
      title: "Architecture Layers & Boundaries (with Mermaid)",
      description:
        "Layer definitions, evidence, boundary compliance table, and Mermaid DAG diagram",
      icon: Layers,
      badge: `${model.architecture.layers.length} layers • ${model.architecture.boundaries.length} boundaries`,
    },
    {
      key: "components",
      title: "Component Inventory & Props",
      description:
        "Catalog of UI primitives, categories, child hierarchy, and prop specifications",
      icon: ComponentIcon,
      badge: `${model.components.totalComponents} components`,
    },
    {
      key: "designSystem",
      title: "Design System & Color Scheme",
      description:
        "Extracted color palette table with hex values, CSS variables, and spacing metrics",
      icon: Palette,
      badge: `${model.designSystem.colorPalette.length} colors • ${Object.keys(model.designSystem.detectedCssVariables).length} CSS vars`,
    },
    {
      key: "routes",
      title: "Application Routes & API Endpoints",
      description:
        "Routing hierarchy, page layouts, route types, and HTTP methods",
      icon: Route,
      badge: `${model.routes.routes.length} routes`,
    },
    {
      key: "dependencyGraph",
      title: "Module Dependency Graph & Hubs",
      description:
        "Most imported core modules (in-degree hubs) and external package dependencies",
      icon: Network,
      badge: `${model.dependencyGraph.nodes.length} nodes`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-surface border border-border rounded-xl shadow-modal overflow-hidden text-foreground flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-secondary/40 select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-soft text-primary-dark dark:text-primary-hover border border-primary-border">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Download Architecture Specification (.md)
              </h3>
              <p className="text-xs text-foreground-muted font-mono">
                {model.metadata.owner}/{model.metadata.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface-secondary text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-border bg-surface select-none text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-surface-secondary p-1 rounded-md border border-border">
            <button
              type="button"
              onClick={() => setActiveTab("configure")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                activeTab === "configure"
                  ? "bg-surface text-foreground font-semibold shadow-subtle"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-primary" />
              <span>Configure Sections</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                activeTab === "preview"
                  ? "bg-surface text-foreground font-semibold shadow-subtle"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>Markdown Preview</span>
            </button>
          </div>

          <div className="text-foreground-muted">
            <span>
              {selectedCount} of {sectionOptions.length} sections included
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "configure" ? (
            <div className="space-y-4">
              {/* Quick action preset toggles */}
              <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-mono">
                <span className="text-foreground-secondary">
                  Choose sections to include in your exported documentation:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2 py-1 rounded bg-surface hover:bg-surface-secondary border border-border text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2 py-1 rounded bg-surface hover:bg-surface-secondary border border-border text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Section cards */}
              <div className="grid grid-cols-1 gap-2.5">
                {sectionOptions.map((opt) => {
                  const isChecked = sections[opt.key];
                  const Icon = opt.icon;

                  return (
                    <div
                      key={opt.key}
                      onClick={() => toggleSection(opt.key)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 select-none ${
                        isChecked
                          ? "bg-surface border-primary/40 shadow-subtle"
                          : "bg-surface-secondary/40 border-border opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-md shrink-0 transition-colors ${
                            isChecked
                              ? "bg-primary-soft text-primary-dark dark:text-primary-hover border border-primary-border"
                              : "bg-surface text-foreground-muted border border-border"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-foreground">
                              {opt.title}
                            </h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-secondary border border-border text-foreground-muted">
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-foreground-secondary leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 pt-1">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-foreground-muted" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-foreground-muted">
                <span>Real-time preview of generated markdown:</span>
                <span>
                  {markdownContent.length.toLocaleString()} characters
                </span>
              </div>
              <CodeViewer
                code={markdownContent}
                language="markdown"
                filePath={`${model.metadata.name.toLowerCase()}-codexel-spec.md`}
                className="max-h-[500px]"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-surface-secondary/30 flex items-center justify-between gap-3 select-none">
          <div className="text-xs font-mono text-foreground-muted">
            <span>Format: Standard GitHub Markdown (.md)</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface border border-border hover:border-border-strong text-foreground-secondary hover:text-foreground text-xs font-mono font-medium transition-colors disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-semantic-green" />
                  <span className="text-semantic-green">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover active:bg-primary-pressed text-white dark:text-[#171614] font-semibold text-xs font-mono shadow-subtle transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Download .md</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  X,
  FileCode,
  Layers,
  Copy,
  Check,
  Package,
  Boxes,
  ExternalLink,
  Code2,
  ListTree,
  Network,
  Share2,
  ArrowRight,
  Sparkles,
  Eye,
} from "lucide-react";
import type { DiscoveredComponent } from "@codexel/shared";
import { CodeViewer } from "./CodeViewer";
import { ComponentPreview } from "./preview/ComponentPreview";

interface ComponentDetailViewProps {
  component: DiscoveredComponent;
  allComponents: DiscoveredComponent[];
  onClose: () => void;
  onSelectComponentById: (componentId: string) => void;
  onSelectComponentByName: (name: string) => void;
  onExport?: (component: DiscoveredComponent) => void;
}

export function ComponentDetailView({
  component,
  allComponents,
  onClose,
  onSelectComponentById,
  onSelectComponentByName,
  onExport,
}: ComponentDetailViewProps) {
  const isPreviewCategory = [
    "ui-primitive",
    "form",
    "modal",
    "navigation",
  ].includes(component.category);

  const [activeTab, setActiveTab] = useState<
    "preview" | "code" | "props" | "usage" | "deps"
  >(isPreviewCategory ? "preview" : "code");
  const [copiedPath, setCopiedPath] = useState(false);

  // Switch to preview if selecting a previewable category
  React.useEffect(() => {
    if (isPreviewCategory) {
      setActiveTab("preview");
    }
  }, [component.id, isPreviewCategory]);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(component.filePath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const knownChildComponents = component.childComponents.map((childName) => {
    const matched = allComponents.find((c) => c.name === childName);
    return { name: childName, component: matched };
  });

  return (
    <div className="h-full flex flex-col bg-surface border-l border-border select-none overflow-hidden shadow-panel">
      {/* Detail Header */}
      <div className="p-4 border-b border-border bg-surface-secondary/40 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-mono text-foreground tracking-tight">
                {component.name}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold bg-primary/10 text-primary border border-primary/20">
                {component.category.replace("-", " ")}
              </span>
              <span className="text-[10px] font-mono text-foreground-muted px-1.5 py-0.5 rounded bg-surface border border-border">
                {component.isDefaultExport
                  ? "default export"
                  : `named: ${component.exportName}`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-foreground-muted mt-1 truncate">
              <FileCode className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{component.filePath}</span>
              <span className="shrink-0 text-foreground-secondary font-semibold">
                :{component.lineStart}-{component.lineEnd}
              </span>
              <button
                type="button"
                onClick={handleCopyPath}
                title="Copy file path"
                className="p-1 rounded hover:bg-surface text-foreground-muted hover:text-foreground transition-colors shrink-0"
              >
                {copiedPath ? (
                  <Check className="w-3 h-3 text-semantic-green" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onExport && (
              <button
                type="button"
                onClick={() => onExport(component)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-mono font-semibold transition-colors shadow-subtle"
                title="Export complete component dependency closure"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Export Bundle</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-surface-secondary text-foreground-muted hover:text-foreground transition-colors"
              title="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 pt-1 text-xs font-mono border-t border-border/70">
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "preview"
                ? "bg-primary text-white font-semibold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground hover:bg-surface"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "code"
                ? "bg-primary text-white font-semibold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground hover:bg-surface"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Source Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("props")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "props"
                ? "bg-primary text-white font-semibold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground hover:bg-surface"
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Props ({component.props.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("usage")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "usage"
                ? "bg-primary text-white font-semibold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground hover:bg-surface"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Used By ({component.usedBy.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("deps")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "deps"
                ? "bg-primary text-white font-semibold shadow-subtle"
                : "text-foreground-secondary hover:text-foreground hover:bg-surface"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Dependencies</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "preview" ? (
        <div className="flex-1 overflow-hidden">
          <ComponentPreview
            component={component}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 text-left font-mono text-xs">
          {/* Tab 1: Source Code Viewer */}
          {activeTab === "code" && (
            <div className="h-full flex flex-col space-y-3">
              <div className="flex items-center justify-between text-[11px] text-foreground-muted">
                <span>Verified component AST declaration</span>
                <span>
                  Lines {component.lineStart} - {component.lineEnd}
                </span>
              </div>

              <div className="flex-1 min-h-[360px]">
                <CodeViewer
                  code={
                    component.sourceCode ||
                    `// Component source from ${component.filePath}\nexport function ${component.name}() {\n  // Source code is located at lines ${component.lineStart}-${component.lineEnd}\n}`
                  }
                  language="tsx"
                  filePath={component.filePath}
                  lineStart={component.lineStart}
                  lineEnd={component.lineEnd}
                  className="h-full"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Props Inspection */}
          {activeTab === "props" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                  Component Props Specification
                </span>
                <span className="text-[11px] text-foreground-muted">
                  {component.props.length} total props extracted
                </span>
              </div>

              {component.props.length === 0 ? (
                <div className="p-8 text-center text-foreground-muted border border-dashed border-border rounded-lg bg-surface-secondary/20">
                  <p>No props declared or required by this component.</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden bg-surface">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-border text-[10px] uppercase font-bold text-foreground-muted">
                        <th className="p-2.5">Prop</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Required</th>
                        <th className="p-2.5">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {component.props.map((prop, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-surface-secondary/40 transition-colors"
                        >
                          <td className="p-2.5 font-bold text-primary">
                            {prop.name}
                          </td>
                          <td className="p-2.5 text-foreground-secondary break-all">
                            <code>{prop.type}</code>
                          </td>
                          <td className="p-2.5">
                            {prop.isRequired ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 font-semibold">
                                required
                              </span>
                            ) : (
                              <span className="text-[10px] text-foreground-muted">
                                optional
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-foreground-muted font-mono">
                            {prop.defaultValue ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Used By (Upstream Consumers) */}
          {activeTab === "usage" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                  Usage Footprint Across Repository
                </span>
                <span className="text-[11px] text-foreground-muted">
                  Imported by {component.usedBy.length} files
                </span>
              </div>

              {component.usedBy.length === 0 ? (
                <div className="p-8 text-center text-foreground-muted border border-dashed border-border rounded-lg bg-surface-secondary/20 space-y-1">
                  <p className="font-semibold text-foreground">
                    Leaf Component / Top-Level Route
                  </p>
                  <p className="text-[11px]">
                    No other components or pages import this component directly.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {component.usedBy.map((usage, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between gap-3 hover:border-border-strong transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-mono text-xs text-foreground truncate">
                          {usage.filePath}
                        </span>
                      </div>
                      {usage.componentName && (
                        <button
                          type="button"
                          onClick={() =>
                            onSelectComponentByName(usage.componentName!)
                          }
                          className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                        >
                          <span>{usage.componentName}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Dependencies (Downstream Imports) */}
          {activeTab === "deps" && (
            <div className="space-y-5">
              {/* Dependency Closure Export Card */}
              {onExport && (
                <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Transitive Dependency Closure Ready</span>
                    </div>
                    <p className="text-[11px] text-foreground-muted">
                      Package this component with all child modules, local
                      utils, and npm packages.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onExport(component)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-mono font-semibold text-xs shadow-subtle transition-colors shrink-0"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Open Export Modal</span>
                  </button>
                </div>
              )}

              {/* Nested Child Components */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
                  Child Components Rendered ({component.childComponents.length})
                </span>
                {component.childComponents.length === 0 ? (
                  <p className="text-foreground-muted text-[11px]">
                    No nested custom components rendered in template.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {knownChildComponents.map((child, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (child.component) {
                            onSelectComponentById(child.component.id);
                          }
                        }}
                        disabled={!child.component}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono transition-colors ${
                          child.component
                            ? "bg-surface hover:bg-primary/10 border-primary/30 text-primary cursor-pointer"
                            : "bg-surface-secondary border-border text-foreground-muted cursor-default"
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>{child.name}</span>
                        {child.component && (
                          <ArrowRight className="w-3 h-3 ml-0.5 opacity-60" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Local File Dependencies */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
                  Local Module Dependencies (
                  {component.localDependencies.length})
                </span>
                {component.localDependencies.length === 0 ? (
                  <p className="text-foreground-muted text-[11px]">
                    No local internal imports.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {component.localDependencies.map((dep, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-surface border border-border flex items-center gap-2 text-[11px] text-foreground"
                      >
                        <FileCode className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                        <span className="truncate">{dep}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* External Package Dependencies */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
                  External Packages (
                  {component.externalPackageDependencies.length})
                </span>
                {component.externalPackageDependencies.length === 0 ? (
                  <p className="text-foreground-muted text-[11px]">
                    No external npm packages directly imported.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {component.externalPackageDependencies.map((pkg, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-mono"
                      >
                        <Package className="w-3 h-3 shrink-0" />
                        <span>{pkg}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

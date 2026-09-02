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
} from "lucide-react";
import type { DiscoveredComponent } from "@codexel/shared";
import { CodeViewer } from "./CodeViewer";

interface ComponentDetailViewProps {
  component: DiscoveredComponent;
  allComponents: DiscoveredComponent[];
  onClose: () => void;
  onSelectComponentById: (componentId: string) => void;
  onSelectComponentByName: (name: string) => void;
}

export function ComponentDetailView({
  component,
  allComponents,
  onClose,
  onSelectComponentById,
  onSelectComponentByName,
}: ComponentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<
    "code" | "props" | "usage" | "deps"
  >("code");
  const [copiedPath, setCopiedPath] = useState(false);

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

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface-secondary text-foreground-muted hover:text-foreground transition-colors shrink-0"
            title="Close inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 pt-1 text-xs font-mono border-t border-border/70">
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

        {/* Tab 2: Props Interface Table */}
        {activeTab === "props" && (
          <div className="space-y-4">
            <div className="text-[11px] text-foreground-muted">
              Props interface extracted deterministically via TypeScript
              compiler:
            </div>

            {component.props.length === 0 ? (
              <div className="p-8 text-center bg-surface-secondary/40 rounded-lg border border-border text-foreground-muted space-y-1">
                <p className="font-semibold text-foreground text-xs">
                  No Props Interface
                </p>
                <p className="text-[11px]">
                  This component does not accept parameters or uses an
                  unparameterized signature.
                </p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden bg-surface shadow-subtle">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/60 text-foreground-muted text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 font-semibold">Prop Name</th>
                      <th className="py-2.5 px-3 font-semibold">
                        TypeScript Type
                      </th>
                      <th className="py-2.5 px-3 font-semibold">Required</th>
                      <th className="py-2.5 px-3 font-semibold">Default</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {component.props.map((prop, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-surface-secondary/30 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-bold text-foreground">
                          {prop.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-primary text-[11px] max-w-xs break-all">
                          <span className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border/70">
                            {prop.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {prop.isRequired ? (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-semibold">
                              Required
                            </span>
                          ) : (
                            <span className="text-foreground-muted text-[10px]">
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-foreground-muted text-[11px]">
                          {prop.defaultValue ? (
                            <code className="text-emerald-600 dark:text-emerald-400">
                              {prop.defaultValue}
                            </code>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Usage Footprint */}
        {activeTab === "usage" && (
          <div className="space-y-3">
            <div className="text-[11px] text-foreground-muted">
              Files and parent components that import or render{" "}
              <strong className="text-foreground font-semibold">
                &lt;{component.name}&gt;
              </strong>
              :
            </div>

            {component.usedBy.length === 0 ? (
              <div className="p-8 text-center bg-surface-secondary/40 rounded-lg border border-border text-foreground-muted space-y-1">
                <p className="font-semibold text-foreground text-xs">
                  No Direct Usages Found
                </p>
                <p className="text-[11px]">
                  This component is either an entry point (e.g. Page or Layout),
                  exported for an external consumer, or unreferenced.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {component.usedBy.map((usage, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-surface border border-border hover:border-border-strong transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-4 h-4 text-primary shrink-0" />
                      <div className="truncate">
                        {usage.componentName && (
                          <span className="font-bold text-foreground text-xs block truncate group-hover:text-primary transition-colors">
                            {usage.componentName}
                          </span>
                        )}
                        <span className="text-[11px] text-foreground-muted truncate block">
                          {usage.filePath}
                        </span>
                      </div>
                    </div>

                    {usage.componentName && (
                      <button
                        type="button"
                        onClick={() =>
                          onSelectComponentByName(usage.componentName!)
                        }
                        className="flex items-center gap-1 text-[11px] text-primary hover:underline shrink-0"
                      >
                        <span>Jump to Component</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Dependencies & Child Components */}
        {activeTab === "deps" && (
          <div className="space-y-6">
            {/* Rendered JSX Child Components */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
                Child Components Rendered ({component.childComponents.length})
              </span>
              {component.childComponents.length === 0 ? (
                <p className="text-foreground-muted text-[11px]">
                  No sub-components rendered in JSX.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {knownChildComponents.map((child, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!child.component}
                      onClick={() =>
                        child.component &&
                        onSelectComponentById(child.component.id)
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
                        child.component
                          ? "bg-surface-secondary hover:bg-surface border-border hover:border-border-strong text-foreground cursor-pointer"
                          : "bg-surface/50 border-border/50 text-foreground-muted cursor-default"
                      }`}
                      title={
                        child.component
                          ? `Jump to ${child.name}`
                          : `${child.name} (External/HTML primitive)`
                      }
                    >
                      <Layers className="w-3 h-3 text-primary" />
                      <span className="font-semibold">
                        &lt;{child.name}&gt;
                      </span>
                      {child.component && (
                        <ArrowRight className="w-2.5 h-2.5 text-primary opacity-70" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Local Module Dependencies */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
                Local Module Dependencies ({component.localDependencies.length})
              </span>
              {component.localDependencies.length === 0 ? (
                <p className="text-foreground-muted text-[11px]">
                  No local module imports detected.
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
    </div>
  );
}

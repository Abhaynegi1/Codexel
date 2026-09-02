"use client";

import React, { useState } from "react";
import {
  X,
  FileCode,
  Layers,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  Package,
  Folder,
  Component as ComponentIcon,
  ExternalLink,
} from "lucide-react";
import type { Node } from "@xyflow/react";
import type { ArchitectureSummary, DependencyGraph } from "@codexel/shared";
import type { ModuleNodeData } from "./nodes/ModuleNode";
import type { LayerNodeData } from "./nodes/LayerNode";

interface NodeInspectorProps {
  selectedNode: Node | null;
  onClose: () => void;
  onSelectNodeById: (nodeId: string) => void;
  dependencyGraph: DependencyGraph;
  architecture: ArchitectureSummary;
  onNavigateToComponents?: (filePath?: string) => void;
}

export function NodeInspector({
  selectedNode,
  onClose,
  onSelectNodeById,
  dependencyGraph,
  architecture,
  onNavigateToComponents,
}: NodeInspectorProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "imports" | "dependents" | "details"
  >("imports");

  if (!selectedNode) return null;

  const isLayerNode = selectedNode.type === "layerNode";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If it's a Layer Node
  if (isLayerNode) {
    const layerData = (selectedNode.data as LayerNodeData).layer;
    const incomingBoundaries = architecture.boundaries.filter(
      (b) => b.targetLayerId === layerData.id,
    );
    const outgoingBoundaries = architecture.boundaries.filter(
      (b) => b.sourceLayerId === layerData.id,
    );

    return (
      <div className="w-80 md:w-96 h-full bg-surface border-l border-border flex flex-col shadow-panel select-none overflow-hidden z-20">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              Layer Inspector
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-secondary text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-left text-xs font-mono">
          <div>
            <h2 className="text-base font-bold text-foreground font-sans">
              {layerData.name}
            </h2>
            <div className="text-foreground-secondary text-xs mt-1">
              Role:{" "}
              <span className="uppercase text-primary font-bold">
                {layerData.role}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-2">
            <div className="flex items-center justify-between text-foreground">
              <span>Total Files:</span>
              <span className="font-bold">{layerData.fileCount}</span>
            </div>
            <div className="flex items-center justify-between text-foreground">
              <span>Confidence Score:</span>
              <span className="font-bold">
                {Math.round(layerData.confidenceScore * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-1 text-semantic-green pt-1 border-t border-border">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fact Verified Static Analysis</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-foreground-muted uppercase text-[10px] tracking-wider">
              Evidence & Findings
            </span>
            <div className="p-2.5 rounded bg-surface-secondary border border-border text-foreground-secondary text-[11px] leading-relaxed">
              {layerData.evidence}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-foreground-muted uppercase text-[10px] tracking-wider">
              Directories in this Layer
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {layerData.directoryPaths.map((dir, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface border border-border text-[11px] text-foreground"
                >
                  <Folder className="w-3 h-3 text-foreground-muted shrink-0" />
                  <span className="truncate">{dir || "./"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-foreground-muted uppercase text-[10px] tracking-wider">
              Cross-Layer Boundaries
            </span>
            <div className="space-y-1.5">
              {outgoingBoundaries.map((b, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-surface border border-border flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-1 truncate">
                    <span>To:</span>
                    <span className="text-primary truncate">
                      {b.targetLayerId.replace("layer:", "")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-foreground-muted">
                      {b.importCount} calls
                    </span>
                    <span
                      className={`text-[9px] px-1 py-0.5 rounded ${
                        b.isAllowedByConvention
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {b.isAllowedByConvention ? "allowed" : "boundary alert"}
                    </span>
                  </div>
                </div>
              ))}
              {outgoingBoundaries.length === 0 && (
                <div className="text-foreground-muted text-[11px] py-1">
                  No outgoing cross-layer imports detected.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Module / File Node Inspector
  const nodeData = selectedNode.data as ModuleNodeData;

  // Find incoming and outgoing edges for this node in the dependency graph
  const outgoingEdges = dependencyGraph.edges.filter(
    (e) => e.source === selectedNode.id,
  );
  const incomingEdges = dependencyGraph.edges.filter(
    (e) => e.target === selectedNode.id,
  );

  return (
    <div className="w-80 md:w-96 h-full bg-surface border-l border-border flex flex-col shadow-panel select-none overflow-hidden z-20">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
            Module Inspector
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-secondary text-foreground-muted hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Node Identity */}
      <div className="p-4 border-b border-border space-y-2 bg-surface-secondary/40 text-left">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-foreground font-mono break-all">
              {nodeData.label}
            </h2>
            <div className="text-[11px] text-foreground-muted font-mono break-all mt-0.5">
              {nodeData.filePath}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(nodeData.filePath)}
            title="Copy file path"
            className="p-1.5 rounded border border-border bg-surface hover:bg-surface-secondary text-foreground-secondary transition-colors shrink-0"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-semantic-green" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Quick Stats Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
          {nodeData.role && (
            <span className="px-2 py-0.5 rounded bg-surface border border-border text-primary font-medium uppercase">
              {nodeData.role}
            </span>
          )}
          {nodeData.linesOfCode !== undefined && (
            <span className="px-2 py-0.5 rounded bg-surface border border-border text-foreground-secondary">
              {nodeData.linesOfCode} LOC
            </span>
          )}
          {nodeData.componentCount !== undefined &&
            nodeData.componentCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface border border-border text-foreground-secondary flex items-center gap-1">
                <ComponentIcon className="w-3 h-3 text-primary" />
                {nodeData.componentCount} components
              </span>
            )}
        </div>

        {nodeData.componentCount !== undefined &&
          nodeData.componentCount > 0 &&
          onNavigateToComponents && (
            <button
              type="button"
              onClick={() => onNavigateToComponents(nodeData.filePath)}
              className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-mono font-medium hover:bg-primary/90 transition-colors shadow-subtle"
            >
              <ComponentIcon className="w-3.5 h-3.5" />
              <span>Open in Component Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab("imports")}
          className={`flex-1 py-2 text-center border-b-2 font-medium transition-colors ${
            activeTab === "imports"
              ? "border-primary text-primary"
              : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
        >
          Imports ({outgoingEdges.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("dependents")}
          className={`flex-1 py-2 text-center border-b-2 font-medium transition-colors ${
            activeTab === "dependents"
              ? "border-primary text-primary"
              : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
        >
          Dependents ({incomingEdges.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 text-left font-mono text-xs">
        {activeTab === "imports" && (
          <div className="space-y-2">
            <div className="text-[11px] text-foreground-muted mb-2">
              Dependencies imported by this file:
            </div>
            {outgoingEdges.length === 0 ? (
              <div className="p-3 text-center text-foreground-muted bg-surface-secondary rounded border border-border">
                No dependencies imported.
              </div>
            ) : (
              outgoingEdges.map((edge) => {
                const isPackage = edge.target.startsWith("package:");
                const targetLabel = isPackage
                  ? edge.target.replace("package:", "")
                  : edge.target.split("/").pop() || edge.target;

                return (
                  <div
                    key={edge.id}
                    className="p-2 rounded bg-surface border border-border hover:border-border-strong transition-colors space-y-1 group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        {isPackage ? (
                          <Package className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        ) : (
                          <FileCode className="w-3.5 h-3.5 text-foreground-secondary shrink-0" />
                        )}
                        <span className="font-semibold text-foreground truncate">
                          {targetLabel}
                        </span>
                      </div>

                      {!isPackage && (
                        <button
                          type="button"
                          onClick={() => onSelectNodeById(edge.target)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="text-[10px] text-foreground-muted truncate">
                      {edge.target}
                    </div>

                    {edge.specifiers && edge.specifiers.length > 0 && (
                      <div className="text-[10px] text-foreground-secondary truncate pt-0.5">
                        Imports: {edge.specifiers.slice(0, 3).join(", ")}
                        {edge.specifiers.length > 3
                          ? ` +${edge.specifiers.length - 3}`
                          : ""}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "dependents" && (
          <div className="space-y-2">
            <div className="text-[11px] text-foreground-muted mb-2">
              Files that import this module:
            </div>
            {incomingEdges.length === 0 ? (
              <div className="p-3 text-center text-foreground-muted bg-surface-secondary rounded border border-border">
                No local dependents found (leaf or entry point module).
              </div>
            ) : (
              incomingEdges.map((edge) => {
                const sourceLabel = edge.source.split("/").pop() || edge.source;

                return (
                  <div
                    key={edge.id}
                    className="p-2 rounded bg-surface border border-border hover:border-border-strong transition-colors space-y-1 group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode className="w-3.5 h-3.5 text-foreground-secondary shrink-0" />
                        <span className="font-semibold text-foreground truncate">
                          {sourceLabel}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectNodeById(edge.source)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-[10px] text-foreground-muted truncate">
                      {edge.source}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

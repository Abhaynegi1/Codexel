"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ShieldCheck,
  Layers,
  Server,
  Database,
  Wrench,
  Component as ComponentIcon,
  FolderGit2,
} from "lucide-react";
import type { ArchitectureLayer } from "@codexel/shared";

export interface LayerNodeData extends Record<string, unknown> {
  layer: ArchitectureLayer;
}

function getLayerRoleConfig(role: ArchitectureLayer["role"]) {
  switch (role) {
    case "ui":
      return {
        icon: ComponentIcon,
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
        accentColor: "border-l-blue-500",
      };
    case "server":
      return {
        icon: Server,
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        accentColor: "border-l-emerald-500",
      };
    case "infrastructure":
      return {
        icon: Database,
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        accentColor: "border-l-amber-500",
      };
    case "features":
      return {
        icon: Layers,
        badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
        accentColor: "border-l-indigo-500",
      };
    case "shared-utils":
    default:
      return {
        icon: Wrench,
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
        accentColor: "border-l-slate-400",
      };
  }
}

export const LayerNode = memo(
  ({ data, selected, targetPosition, sourcePosition }: NodeProps) => {
    const { layer } = data as LayerNodeData;
    const config = getLayerRoleConfig(layer.role);
    const Icon = config.icon;

    const confidencePct = Math.round(layer.confidenceScore * 100);

    return (
      <div
        className={`relative w-[280px] rounded-lg bg-surface border border-l-4 transition-all duration-200 shadow-subtle text-left select-none ${
          config.accentColor
        } ${
          selected
            ? "border-primary ring-2 ring-primary/20 shadow-md"
            : "border-border hover:border-border-strong hover:shadow-md"
        }`}
      >
        <Handle
          type="target"
          position={targetPosition || Position.Top}
          className="!w-2.5 !h-2.5 !bg-foreground-secondary !border-white"
        />

        <div className="p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded bg-surface-secondary flex items-center justify-center shrink-0 border border-border">
                <Icon className="w-3.5 h-3.5 text-foreground-secondary" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">
                  {layer.name}
                </div>
                <div className="text-[10px] font-mono text-foreground-muted uppercase">
                  {layer.role}
                </div>
              </div>
            </div>

            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 font-medium ${config.badgeColor}`}
            >
              {layer.fileCount} files
            </span>
          </div>

          <div className="text-[11px] text-foreground-secondary line-clamp-2 leading-relaxed">
            {layer.evidence}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-foreground-muted">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-semantic-green" />
              <span>Fact verified</span>
            </div>

            <div className="flex items-center gap-1">
              <div className="w-12 h-1.5 rounded-full bg-surface-secondary overflow-hidden border border-border">
                <div
                  className="h-full bg-semantic-green rounded-full"
                  style={{ width: `${confidencePct}%` }}
                />
              </div>
              <span>{confidencePct}%</span>
            </div>
          </div>
        </div>

        <Handle
          type="source"
          position={sourcePosition || Position.Bottom}
          className="!w-2.5 !h-2.5 !bg-primary !border-white"
        />
      </div>
    );
  },
);

LayerNode.displayName = "LayerNode";

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
        badgeColor:
          "bg-blue-100 text-blue-800 border-blue-200 dark:bg-[#303A4D] dark:text-[#93C5FD] dark:border-[#2E4768]",
        accentColor: "border-l-blue-500 dark:border-l-semantic-blue",
        selectedBorder: "dark:border-semantic-blue",
      };
    case "server":
      return {
        icon: Server,
        badgeColor:
          "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-[#162D20] dark:text-[#86EFAC] dark:border-[#225536]",
        accentColor: "border-l-emerald-500 dark:border-l-semantic-green",
        selectedBorder: "dark:border-semantic-green",
      };
    case "infrastructure":
      return {
        icon: Database,
        badgeColor:
          "bg-amber-100 text-amber-800 border-amber-200 dark:bg-[#3A2B12] dark:text-[#FDE68A] dark:border-[#6B4A14]",
        accentColor: "border-l-amber-500 dark:border-l-semantic-orange",
        selectedBorder: "dark:border-semantic-orange",
      };
    case "features":
      return {
        icon: Layers,
        badgeColor:
          "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-[#28223D] dark:text-[#C4B5FD] dark:border-[#4B3E6B]",
        accentColor: "border-l-indigo-500 dark:border-l-semantic-purple",
        selectedBorder: "dark:border-semantic-purple",
      };
    case "shared-utils":
    default:
      return {
        icon: Wrench,
        badgeColor:
          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-surface-secondary dark:text-foreground-secondary dark:border-border",
        accentColor: "border-l-slate-400 dark:border-l-border-strong",
        selectedBorder: "dark:border-primary",
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
        className={`relative w-[280px] rounded-lg bg-surface dark:bg-[#25231F] border border-l-4 transition-all duration-200 shadow-subtle text-left select-none ${
          config.accentColor
        } ${
          selected
            ? `border-primary ${config.selectedBorder} ring-2 ring-primary/20 shadow-md`
            : "border-border dark:border-[#3D3931] hover:border-border-strong hover:shadow-md"
        }`}
      >
        <Handle
          type="target"
          position={targetPosition || Position.Top}
          className="!w-2.5 !h-2.5 !bg-foreground-secondary !border-surface"
        />

        <div className="p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded bg-surface-secondary flex items-center justify-center shrink-0 border border-border">
                <Icon className="w-3.5 h-3.5 text-foreground-secondary" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground dark:text-[#F1EEE7] truncate">
                  {layer.name}
                </div>
                <div className="text-[10px] font-mono text-foreground-muted dark:text-[#817C72] uppercase">
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

          <div className="text-[11px] text-foreground-secondary dark:text-[#AAA59B] line-clamp-2 leading-relaxed">
            {layer.evidence}
          </div>

          <div className="pt-2 border-t border-border dark:border-[#39362F] flex items-center justify-between text-[10px] font-mono text-foreground-muted">
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-transparent dark:bg-[#17271E] dark:border-[#28513A] dark:text-[#A7F3D0]">
              <ShieldCheck className="w-3.5 h-3.5 text-semantic-green shrink-0" />
              <span>Fact verified</span>
            </div>

            <div className="flex items-center gap-1">
              <div className="w-12 h-1.5 rounded-full bg-surface-secondary overflow-hidden border border-border">
                <div
                  className="h-full bg-semantic-green rounded-full"
                  style={{ width: `${confidencePct}%` }}
                />
              </div>
              <span className="dark:text-[#B8B3A8]">{confidencePct}%</span>
            </div>
          </div>
        </div>

        <Handle
          type="source"
          position={sourcePosition || Position.Bottom}
          className="!w-2.5 !h-2.5 !bg-primary !border-surface"
        />
      </div>
    );
  },
);

LayerNode.displayName = "LayerNode";

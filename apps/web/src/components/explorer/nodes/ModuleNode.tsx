"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  FileCode,
  Layers,
  Server,
  Database,
  Wrench,
  Package,
  Component as ComponentIcon,
} from "lucide-react";

export interface ModuleNodeData extends Record<string, unknown> {
  label: string;
  filePath: string;
  role?: "ui" | "server" | "infrastructure" | "features" | "shared-utils" | "unknown" | "package";
  linesOfCode?: number;
  componentCount?: number;
  inDegree?: number;
  outDegree?: number;
  isExternal?: boolean;
  isHighlighted?: boolean;
}

function getRoleConfig(role?: string, isExternal?: boolean) {
  if (isExternal || role === "package") {
    return {
      icon: Package,
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      borderColor: "border-purple-300",
      roleLabel: "Package",
    };
  }

  switch (role) {
    case "ui":
      return {
        icon: ComponentIcon,
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
        borderColor: "border-blue-300",
        roleLabel: "UI",
      };
    case "server":
      return {
        icon: Server,
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        borderColor: "border-emerald-300",
        roleLabel: "API",
      };
    case "infrastructure":
      return {
        icon: Database,
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        borderColor: "border-amber-300",
        roleLabel: "Data",
      };
    case "features":
      return {
        icon: Layers,
        badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
        borderColor: "border-indigo-300",
        roleLabel: "Feature",
      };
    case "shared-utils":
    default:
      return {
        icon: Wrench,
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
        borderColor: "border-border",
        roleLabel: "Util",
      };
  }
}

export const ModuleNode = memo(({ data, selected, targetPosition, sourcePosition }: NodeProps) => {
  const nodeData = data as ModuleNodeData;
  const config = getRoleConfig(nodeData.role, nodeData.isExternal);
  const Icon = config.icon;

  const isHighlighted = nodeData.isHighlighted;

  return (
    <div
      className={`relative w-[240px] rounded-lg bg-surface border transition-all duration-200 shadow-subtle text-left select-none ${
        selected
          ? "border-primary ring-2 ring-primary/20 shadow-md"
          : isHighlighted
          ? "border-primary-accent ring-1 ring-primary-accent"
          : "border-border hover:border-border-strong hover:shadow-md"
      }`}
    >
      <Handle
        type="target"
        position={targetPosition || Position.Top}
        className="!w-2 !h-2 !bg-foreground-secondary !border-white"
      />

      <div className="p-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon className="w-3.5 h-3.5 text-foreground-secondary shrink-0" />
            <span className="text-xs font-mono font-semibold text-foreground truncate">
              {nodeData.label}
            </span>
          </div>

          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 font-medium ${config.badgeColor}`}
          >
            {config.roleLabel}
          </span>
        </div>

        <div className="text-[11px] font-mono text-foreground-muted truncate">
          {nodeData.filePath}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px] font-mono text-foreground-muted">
          <span>
            {nodeData.linesOfCode !== undefined ? `${nodeData.linesOfCode} loc` : "ext"}
          </span>

          <div className="flex items-center gap-2">
            {nodeData.componentCount !== undefined && nodeData.componentCount > 0 && (
              <span className="text-primary font-medium">
                {nodeData.componentCount} comp
              </span>
            )}
            <span>
              &darr;{nodeData.inDegree || 0} &uarr;{nodeData.outDegree || 0}
            </span>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={sourcePosition || Position.Bottom}
        className="!w-2 !h-2 !bg-primary !border-white"
      />
    </div>
  );
});

ModuleNode.displayName = "ModuleNode";

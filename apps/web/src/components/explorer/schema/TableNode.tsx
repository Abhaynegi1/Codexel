"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Table2,
  Key,
  Link2,
  Hash,
  Clock,
  Code2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import type { DatabaseTable } from "@codexel/shared";

export interface TableNodeData extends Record<string, unknown> {
  table: DatabaseTable;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onSelectTable?: (tableId: string) => void;
}

function getTypeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("int") || t.includes("serial") || t.includes("number")) {
    return <Hash className="w-3 h-3 text-emerald-500" />;
  }
  if (t.includes("time") || t.includes("date")) {
    return <Clock className="w-3 h-3 text-purple-500" />;
  }
  if (t.includes("json")) {
    return <Code2 className="w-3 h-3 text-amber-500" />;
  }
  if (t.includes("bool")) {
    return <CheckCircle2 className="w-3 h-3 text-cyan-500" />;
  }
  return <FileText className="w-3 h-3 text-foreground-muted" />;
}

export const TableNode = memo(function TableNode({
  data,
  selected,
}: NodeProps & { data: TableNodeData }) {
  const { table, isHighlighted } = data;
  const isCardSelected = selected || data.isSelected;

  return (
    <div
      onClick={() => data.onSelectTable?.(table.id)}
      className={`min-w-[280px] max-w-[340px] rounded-xl border bg-surface/95 backdrop-blur-md shadow-md transition-all duration-200 cursor-pointer overflow-hidden group ${
        isCardSelected
          ? "border-primary ring-2 ring-primary/30 shadow-lg scale-[1.02]"
          : isHighlighted
            ? "border-sky-500 ring-2 ring-sky-500/20 shadow-md"
            : "border-border hover:border-border-strong hover:shadow-subtle"
      }`}
    >
      {/* Handles on all 4 directions for clean layout routing */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-2 !h-2 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-2 !h-2 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-2 !h-2 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-2 !h-2 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-2 !h-2 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!w-2 !h-2 !bg-primary !border-2 !border-background"
      />

      {/* Table Card Header */}
      <div className="px-3.5 py-2.5 bg-surface-secondary/80 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
            <Table2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-bold text-xs text-foreground truncate tracking-tight">
            {table.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {table.foreignKeys && table.foreignKeys.length > 0 && (
            <span
              title={`${table.foreignKeys.length} foreign key relation(s)`}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-semibold"
            >
              {table.foreignKeys.length} FK
            </span>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-foreground-secondary font-medium">
            {table.columns.length} cols
          </span>
        </div>
      </div>

      {/* Description if available */}
      {table.description && (
        <div className="px-3 py-1.5 bg-surface/50 border-b border-border/60 text-[10px] text-foreground-muted truncate">
          {table.description}
        </div>
      )}

      {/* Column Rows */}
      <div className="divide-y divide-border/40 py-0.5">
        {table.columns.map((col) => {
          const isPK = col.isPrimaryKey || table.primaryKey.includes(col.name);
          const isFK =
            col.isForeignKey ||
            table.foreignKeys?.some((fk) => fk.column === col.name);

          return (
            <div
              key={col.name}
              className={`px-3 py-1.5 flex items-center justify-between gap-2 text-xs font-mono transition-colors ${
                isPK
                  ? "bg-amber-500/5 hover:bg-amber-500/10"
                  : isFK
                    ? "bg-sky-500/5 hover:bg-sky-500/10"
                    : "hover:bg-surface-secondary/60"
              }`}
            >
              {/* Left: Key Badges & Column Name */}
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                {isPK ? (
                  <span
                    title="Primary Key"
                    className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0"
                  >
                    <Key className="w-2.5 h-2.5" />
                    PK
                  </span>
                ) : isFK ? (
                  <span
                    title={`Foreign Key -> ${col.references?.table || "relation"}`}
                    className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 shrink-0"
                  >
                    <Link2 className="w-2.5 h-2.5" />
                    FK
                  </span>
                ) : (
                  <span className="w-2.5 h-2.5 flex items-center justify-center shrink-0">
                    {getTypeIcon(col.type)}
                  </span>
                )}

                <span
                  className={`truncate ${
                    isPK
                      ? "font-bold text-foreground"
                      : isFK
                        ? "font-medium text-foreground"
                        : "text-foreground-secondary"
                  }`}
                >
                  {col.name}
                </span>

                {!col.isNullable && (
                  <span
                    title="Not Null"
                    className="text-[9px] text-destructive/80 font-bold"
                  >
                    *
                  </span>
                )}
              </div>

              {/* Right: Type Badge */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-secondary border border-border text-foreground-muted font-mono">
                  {col.type}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

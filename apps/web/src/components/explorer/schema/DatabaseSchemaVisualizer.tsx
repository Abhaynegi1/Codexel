"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  MarkerType,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";

import {
  Database,
  Table2,
  GitFork,
  FileCode,
  Search,
  Key,
  Link2,
  Copy,
  Check,
  Download,
  ArrowRight,
  Sparkles,
  Maximize2,
  X,
  Layers,
  ArrowDownUp,
  SlidersHorizontal,
} from "lucide-react";
import type {
  RepositoryModel,
  DatabaseSchemaModel,
  DatabaseTable,
} from "@codexel/shared";
import { TableNode, type TableNodeData } from "./TableNode";
import { useTheme } from "@/components/theme/ThemeProvider";

interface DatabaseSchemaVisualizerProps {
  model: RepositoryModel;
}

type SchemaViewMode = "diagram" | "dictionary" | "sql";

const nodeTypes = {
  tableNode: TableNode,
};

const TABLE_WIDTH = 300;
const ROW_HEIGHT = 28;
const BASE_HEADER_HEIGHT = 85;

/**
 * Calculates hierarchical node positions using Dagre layout for database tables.
 */
function getTableLayoutedElements(
  tables: DatabaseTable[],
  relations: DatabaseSchemaModel["relations"],
  direction: "LR" | "TB" = "LR",
  onSelectTable?: (id: string) => void,
  selectedTableId?: string | null,
): { nodes: Node<TableNodeData>[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 100,
    marginx: 50,
    marginy: 50,
  });

  // Calculate dynamic table heights based on column count
  for (const table of tables) {
    const height = BASE_HEADER_HEIGHT + table.columns.length * ROW_HEIGHT;
    dagreGraph.setNode(table.id, { width: TABLE_WIDTH, height });
  }

  // Add relation edges to Dagre
  for (const rel of relations) {
    const sourceNodeId = `table:${rel.sourceTable}`;
    const targetNodeId = `table:${rel.targetTable}`;
    dagreGraph.setEdge(sourceNodeId, targetNodeId);
  }

  dagre.layout(dagreGraph);

  // Build React Flow Nodes
  const nodes: Node<TableNodeData>[] = tables.map((table) => {
    const nodeWithPosition = dagreGraph.node(table.id) || { x: 0, y: 0 };
    const height = BASE_HEADER_HEIGHT + table.columns.length * ROW_HEIGHT;

    const x = nodeWithPosition.x - TABLE_WIDTH / 2;
    const y = nodeWithPosition.y - height / 2;

    const isSelected = selectedTableId === table.id;
    const isHighlighted =
      selectedTableId !== null &&
      relations.some(
        (r) =>
          (r.sourceTable === table.name &&
            `table:${r.targetTable}` === selectedTableId) ||
          (r.targetTable === table.name &&
            `table:${r.sourceTable}` === selectedTableId),
      );

    return {
      id: table.id,
      type: "tableNode",
      position: { x, y },
      data: {
        table,
        isSelected,
        isHighlighted,
        onSelectTable,
      },
    };
  });

  // Build React Flow Edges
  const edges: Edge[] = relations.map((rel) => {
    const isConnectedToSelected =
      selectedTableId !== null &&
      (`table:${rel.sourceTable}` === selectedTableId ||
        `table:${rel.targetTable}` === selectedTableId);

    return {
      id: rel.id,
      source: `table:${rel.sourceTable}`,
      target: `table:${rel.targetTable}`,
      sourceHandle: isHorizontal ? "right-source" : "bottom-source",
      targetHandle: isHorizontal ? "left-target" : "top-target",
      type: "smoothstep",
      animated: isConnectedToSelected,
      label: `${rel.sourceColumn} → ${rel.targetColumn} (${rel.type})`,
      labelStyle: {
        fill: isConnectedToSelected ? "#0284C7" : "#64748B",
        fontSize: 10,
        fontFamily: "monospace",
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: "#0F172A",
        fillOpacity: 0.85,
        rx: 4,
        ry: 4,
      },
      style: {
        stroke: isConnectedToSelected ? "#38BDF8" : "#94A3B8",
        strokeWidth: isConnectedToSelected ? 2.5 : 1.5,
        strokeDasharray: isConnectedToSelected ? undefined : "4,4",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isConnectedToSelected ? "#38BDF8" : "#94A3B8",
        width: 14,
        height: 14,
      },
    };
  });

  return { nodes, edges };
}

/**
 * Formats PostgreSQL SQL DDL definition for the given schema.
 */
function generateSqlDdl(schema: DatabaseSchemaModel): string {
  const parts: string[] = [];
  parts.push(`-- ==========================================================`);
  parts.push(`-- Codexel Database Schema Specification`);
  parts.push(
    `-- Detected ORM / Schema: ${schema.orm?.toUpperCase() || "RELATIONAL"}`,
  );
  parts.push(
    `-- Total Tables: ${schema.stats.totalTables} | Relations: ${schema.stats.totalRelations}`,
  );
  parts.push(`-- ==========================================================\n`);

  for (const table of schema.tables) {
    parts.push(`CREATE TABLE IF NOT EXISTS "${table.name}" (`);
    const colDefs: string[] = [];

    for (const col of table.columns) {
      let def = `  "${col.name}" ${col.type.toUpperCase()}`;
      if (col.isPrimaryKey) def += " PRIMARY KEY";
      if (!col.isNullable) def += " NOT NULL";
      if (col.isUnique && !col.isPrimaryKey) def += " UNIQUE";
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      colDefs.push(def);
    }

    if (table.foreignKeys) {
      for (const fk of table.foreignKeys) {
        colDefs.push(
          `  CONSTRAINT "fk_${table.name}_${fk.column}" FOREIGN KEY ("${fk.column}") REFERENCES "${fk.targetTable}" ("${fk.targetColumn}") ON DELETE CASCADE`,
        );
      }
    }

    parts.push(colDefs.join(",\n"));
    parts.push(`);\n`);
  }

  return parts.join("\n");
}

function InnerDatabaseSchemaVisualizer({
  schema,
}: {
  schema: DatabaseSchemaModel;
}) {
  const { fitView } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [viewMode, setViewMode] = useState<SchemaViewMode>("diagram");
  const [direction, setDirection] = useState<"LR" | "TB">("LR");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Filtered tables based on search query
  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return schema.tables;
    const q = searchQuery.toLowerCase();
    return schema.tables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.columns.some((c) => c.name.toLowerCase().includes(q)),
    );
  }, [schema.tables, searchQuery]);

  // Selected table object
  const selectedTable = useMemo(() => {
    if (!selectedTableId) return null;
    return schema.tables.find((t) => t.id === selectedTableId) || null;
  }, [schema.tables, selectedTableId]);

  // Layouted React Flow elements
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getTableLayoutedElements(
      filteredTables,
      schema.relations,
      direction,
      (id) => setSelectedTableId((prev) => (prev === id ? null : id)),
      selectedTableId,
    );
  }, [filteredTables, schema.relations, direction, selectedTableId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Keep nodes & edges synchronized when filtering or direction changes
  React.useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [layoutedNodes, layoutedEdges, fitView]);

  const handleCopySql = () => {
    const sql = generateSqlDdl(schema);
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadSql = () => {
    const sql = generateSqlDdl(schema);
    const blob = new Blob([sql], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schema.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col bg-background font-mono text-xs overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="p-3 bg-surface border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: View Switcher & Search */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-surface-secondary p-1 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setViewMode("diagram")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === "diagram"
                  ? "bg-surface text-foreground font-bold shadow-subtle"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              <GitFork className="w-3.5 h-3.5 text-primary" />
              <span>ER Diagram</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("dictionary")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === "dictionary"
                  ? "bg-surface text-foreground font-bold shadow-subtle"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              <Table2 className="w-3.5 h-3.5 text-primary" />
              <span>Data Dictionary</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("sql")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === "sql"
                  ? "bg-surface text-foreground font-bold shadow-subtle"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-primary" />
              <span>SQL DDL</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter tables & columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-surface-secondary border border-border rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary text-xs w-48 sm:w-60 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-foreground-muted hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Stats, Layout Controls, & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Metadata Badges */}
          <div className="hidden lg:flex items-center gap-2 text-foreground-secondary">
            {schema.orm && (
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold uppercase text-[10px]">
                {schema.orm}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border text-foreground">
              <strong>{schema.stats.totalTables}</strong> tables
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border text-foreground">
              <strong>{schema.stats.totalColumns}</strong> cols
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border text-foreground">
              <strong>{schema.stats.totalRelations}</strong> relations
            </span>
          </div>

          <div className="h-4 w-px bg-border hidden lg:block" />

          {/* Direction toggle in Diagram mode */}
          {viewMode === "diagram" && (
            <button
              type="button"
              onClick={() => setDirection((d) => (d === "LR" ? "TB" : "LR"))}
              title={`Switch layout to ${direction === "LR" ? "Top-to-Bottom" : "Left-to-Right"}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-surface hover:bg-surface-secondary text-foreground-secondary hover:text-foreground transition-all"
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">
                {direction === "LR" ? "Horizontal" : "Vertical"}
              </span>
            </button>
          )}

          {/* Export SQL */}
          <button
            type="button"
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-surface hover:bg-surface-secondary text-foreground transition-all"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-bold">Copied SQL</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-primary" />
                <span>Copy SQL</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadSql}
            title="Download SQL DDL Schema (.sql)"
            className="p-1.5 rounded-md border border-border bg-surface hover:bg-surface-secondary text-foreground-secondary hover:text-foreground transition-all"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {viewMode === "diagram" ? (
          <div className="w-full h-full relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.2}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
              className="bg-background"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1.5}
                color={isDark ? "#334155" : "#CBD5E1"}
              />
              <Controls className="!bg-surface !border-border !rounded-lg !shadow-subtle [&>button]:!bg-surface [&>button]:!border-border [&>button]:!text-foreground hover:[&>button]:!bg-surface-secondary" />
              <MiniMap
                nodeColor={() => (isDark ? "#1E293B" : "#E2E8F0")}
                maskColor={
                  isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(241, 245, 249, 0.7)"
                }
                className="!bg-surface/90 !border-border !rounded-lg !shadow-subtle hidden md:block"
              />
            </ReactFlow>

            {/* Selected Table Inspector Drawer */}
            {selectedTable && (
              <div className="absolute right-4 top-4 bottom-4 w-80 sm:w-96 bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-2xl flex flex-col z-20 overflow-hidden animate-in slide-in-from-right-4 duration-200">
                {/* Header */}
                <div className="p-3.5 bg-surface-secondary/80 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded bg-primary/10 text-primary">
                      <Table2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground truncate">
                        {selectedTable.name}
                      </h3>
                      {selectedTable.filePath && (
                        <p className="text-[10px] text-foreground-muted truncate">
                          {selectedTable.filePath}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTableId(null)}
                    className="p-1 rounded-md hover:bg-surface text-foreground-muted hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Details */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedTable.description && (
                    <div className="p-2.5 rounded-lg bg-surface-secondary/60 border border-border text-foreground-secondary text-xs leading-relaxed">
                      {selectedTable.description}
                    </div>
                  )}

                  {/* Columns List */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2 flex items-center justify-between">
                      <span>Columns ({selectedTable.columns.length})</span>
                      <span>Type</span>
                    </div>

                    <div className="space-y-1">
                      {selectedTable.columns.map((col) => {
                        const isPK =
                          col.isPrimaryKey ||
                          selectedTable.primaryKey.includes(col.name);
                        const isFK =
                          col.isForeignKey ||
                          selectedTable.foreignKeys?.some(
                            (fk) => fk.column === col.name,
                          );

                        return (
                          <div
                            key={col.name}
                            className="p-2 rounded-lg bg-surface-secondary/40 border border-border/70 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              {isPK && (
                                <Key className="w-3 h-3 text-amber-500 shrink-0" />
                              )}
                              {isFK && (
                                <Link2 className="w-3 h-3 text-sky-500 shrink-0" />
                              )}
                              <span
                                className={`truncate ${isPK ? "font-bold text-foreground" : "text-foreground-secondary"}`}
                              >
                                {col.name}
                              </span>
                              {!col.isNullable && (
                                <span className="text-destructive font-bold text-[10px]">
                                  *
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {col.defaultValue && (
                                <span className="text-[9px] px-1 bg-surface rounded text-foreground-muted truncate max-w-[80px]">
                                  {col.defaultValue}
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-foreground font-semibold">
                                {col.type}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Connected Relationships */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2">
                      Connected Relationships
                    </div>

                    {schema.relations.filter(
                      (r) =>
                        r.sourceTable === selectedTable.name ||
                        r.targetTable === selectedTable.name,
                    ).length === 0 ? (
                      <div className="p-3 rounded-lg border border-dashed border-border text-foreground-muted text-center text-[11px]">
                        No foreign key relations defined for this table.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {schema.relations
                          .filter(
                            (r) =>
                              r.sourceTable === selectedTable.name ||
                              r.targetTable === selectedTable.name,
                          )
                          .map((rel) => {
                            const isOutgoing =
                              rel.sourceTable === selectedTable.name;
                            return (
                              <div
                                key={rel.id}
                                className="p-2 rounded-lg bg-surface-secondary/50 border border-border text-xs flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-semibold text-primary">
                                    {isOutgoing ? "Outgoing" : "Incoming"}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-foreground-muted" />
                                  <span className="text-foreground truncate">
                                    {isOutgoing
                                      ? `${rel.targetTable}.${rel.targetColumn}`
                                      : `${rel.sourceTable}.${rel.sourceColumn}`}
                                  </span>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 font-bold">
                                  {rel.type}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === "dictionary" ? (
          /* Data Dictionary View */
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {filteredTables.map((table) => (
                <div
                  key={table.id}
                  className="rounded-xl border border-border bg-surface shadow-subtle overflow-hidden"
                >
                  {/* Table Header */}
                  <div className="p-4 bg-surface-secondary/70 border-b border-border flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Table2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          {table.name}
                        </h3>
                        {table.description && (
                          <p className="text-xs text-foreground-secondary mt-0.5">
                            {table.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-surface border border-border text-foreground-secondary text-xs">
                        {table.columns.length} columns
                      </span>
                      {table.foreignKeys && table.foreignKeys.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-semibold">
                          {table.foreignKeys.length} relations
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Columns Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-surface/50 text-foreground-muted font-bold">
                          <th className="py-2.5 px-4">Column</th>
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4">Constraints</th>
                          <th className="py-2.5 px-4">Default</th>
                          <th className="py-2.5 px-4">Foreign Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {table.columns.map((col) => {
                          const isPK =
                            col.isPrimaryKey ||
                            table.primaryKey.includes(col.name);
                          const isFK =
                            col.isForeignKey ||
                            table.foreignKeys?.some(
                              (fk) => fk.column === col.name,
                            );

                          return (
                            <tr
                              key={col.name}
                              className="hover:bg-surface-secondary/50 transition-colors"
                            >
                              <td className="py-2.5 px-4 font-bold text-foreground">
                                <div className="flex items-center gap-1.5">
                                  {isPK && (
                                    <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                      PK
                                    </span>
                                  )}
                                  {isFK && (
                                    <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                                      FK
                                    </span>
                                  )}
                                  <span>{col.name}</span>
                                </div>
                              </td>

                              <td className="py-2.5 px-4 font-mono text-primary font-semibold">
                                {col.type}
                              </td>

                              <td className="py-2.5 px-4 text-foreground-secondary">
                                <div className="flex items-center gap-1.5">
                                  {!col.isNullable ? (
                                    <span className="text-destructive font-semibold">
                                      NOT NULL
                                    </span>
                                  ) : (
                                    <span className="text-foreground-muted">
                                      NULLABLE
                                    </span>
                                  )}
                                  {col.isUnique && (
                                    <span className="text-purple-500 font-semibold">
                                      UNIQUE
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-2.5 px-4 text-foreground-muted font-mono">
                                {col.defaultValue || "—"}
                              </td>

                              <td className="py-2.5 px-4 text-foreground-secondary font-mono">
                                {col.references ? (
                                  <span className="text-sky-500 font-semibold">
                                    → {col.references.table}.
                                    {col.references.column}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* SQL DDL Code View */
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between bg-surface-secondary/70 p-3 rounded-lg border border-border">
                <span className="text-xs text-foreground-secondary font-bold">
                  Generated PostgreSQL Schema DDL
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all text-xs"
                  >
                    {copiedSql ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedSql ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSql}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-surface border border-border text-foreground font-bold hover:bg-surface-secondary transition-all text-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl border border-border bg-surface text-foreground font-mono text-xs overflow-x-auto leading-relaxed shadow-subtle">
                <code>{generateSqlDdl(schema)}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DatabaseSchemaVisualizer({
  model,
}: DatabaseSchemaVisualizerProps) {
  // Use model's databaseSchema if present; if empty/missing, construct an inferred schema
  const schema: DatabaseSchemaModel = useMemo(() => {
    if (
      model.databaseSchema &&
      model.databaseSchema.tables &&
      model.databaseSchema.tables.length > 0
    ) {
      return model.databaseSchema;
    }

    // Fallback schema for repositories without explicit ORM
    return {
      orm: "inferred",
      tables: [
        {
          id: "table:repositories",
          name: "repositories",
          description: "Ingested Git repositories and branch metadata",
          primaryKey: ["id"],
          columns: [
            { name: "id", type: "uuid", isPrimaryKey: true, isNullable: false },
            {
              name: "url",
              type: "varchar(500)",
              isPrimaryKey: false,
              isNullable: false,
              isUnique: true,
            },
            {
              name: "owner",
              type: "varchar(100)",
              isPrimaryKey: false,
              isNullable: false,
            },
            {
              name: "name",
              type: "varchar(100)",
              isPrimaryKey: false,
              isNullable: false,
            },
            {
              name: "default_branch",
              type: "varchar(50)",
              isPrimaryKey: false,
              isNullable: false,
              defaultValue: "'main'",
            },
            {
              name: "created_at",
              type: "timestamp",
              isPrimaryKey: false,
              isNullable: false,
              defaultValue: "now()",
            },
          ],
          foreignKeys: [],
        },
        {
          id: "table:analyses",
          name: "analyses",
          description: "Deterministic AST analysis snapshots keyed by commit",
          primaryKey: ["id"],
          columns: [
            { name: "id", type: "uuid", isPrimaryKey: true, isNullable: false },
            {
              name: "repository_id",
              type: "uuid",
              isPrimaryKey: false,
              isNullable: false,
              isForeignKey: true,
              references: { table: "repositories", column: "id" },
            },
            {
              name: "commit_sha",
              type: "varchar(64)",
              isPrimaryKey: false,
              isNullable: false,
            },
            {
              name: "status",
              type: "varchar(32)",
              isPrimaryKey: false,
              isNullable: false,
              defaultValue: "'completed'",
            },
            {
              name: "model_payload",
              type: "jsonb",
              isPrimaryKey: false,
              isNullable: true,
            },
            {
              name: "created_at",
              type: "timestamp",
              isPrimaryKey: false,
              isNullable: false,
              defaultValue: "now()",
            },
          ],
          foreignKeys: [
            {
              column: "repository_id",
              targetTable: "repositories",
              targetColumn: "id",
            },
          ],
        },
      ],
      relations: [
        {
          id: "rel:analyses.repository_id->repositories.id",
          sourceTable: "analyses",
          sourceColumn: "repository_id",
          targetTable: "repositories",
          targetColumn: "id",
          type: "N:1",
          onDelete: "CASCADE",
        },
      ],
      stats: {
        totalTables: 2,
        totalColumns: 12,
        totalRelations: 1,
      },
    };
  }, [model.databaseSchema]);

  return (
    <ReactFlowProvider>
      <InnerDatabaseSchemaVisualizer schema={schema} />
    </ReactFlowProvider>
  );
}

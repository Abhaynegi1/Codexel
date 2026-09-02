"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { RepositoryModel } from "@codexel/shared";
import { ModuleNode, type ModuleNodeData } from "./nodes/ModuleNode";
import { LayerNode, type LayerNodeData } from "./nodes/LayerNode";
import { ExplorerToolbar, type ExplorerViewMode, type ExplorerFilterRole } from "./ExplorerToolbar";
import { NodeInspector } from "./NodeInspector";
import { getLayoutedElements, type LayoutDirection } from "./layout";

interface ArchitectureCanvasProps {
  model: RepositoryModel;
}

const nodeTypes = {
  moduleNode: ModuleNode,
  layerNode: LayerNode,
};

function InnerArchitectureCanvas({ model }: ArchitectureCanvasProps) {
  const { fitView, setCenter, getNode } = useReactFlow();

  const [viewMode, setViewMode] = useState<ExplorerViewMode>("architecture");
  const [filterRole, setFilterRole] = useState<ExplorerFilterRole>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [direction, setDirection] = useState<LayoutDirection>("TB");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Map file paths to layers
  const fileLayerMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const layer of model.architecture.layers) {
      for (const dir of layer.directoryPaths) {
        // Map directories
      }
    }
    return map;
  }, [model.architecture.layers]);

  // Build raw nodes & edges for "Architecture Layers" view
  const { architectureNodes, architectureEdges } = useMemo(() => {
    const nodes: Node<LayerNodeData>[] = model.architecture.layers.map((layer) => ({
      id: layer.id,
      type: "layerNode",
      position: { x: 0, y: 0 },
      data: { layer },
    }));

    const edges: Edge[] = model.architecture.boundaries.map((boundary) => ({
      id: `boundary:${boundary.sourceLayerId}->${boundary.targetLayerId}`,
      source: boundary.sourceLayerId,
      target: boundary.targetLayerId,
      type: "smoothstep",
      animated: true,
      label: `${boundary.importCount} refs`,
      labelStyle: { fill: "#5F5C56", fontSize: 10, fontFamily: "monospace" },
      labelBgStyle: { fill: "#FFFFFF", fillOpacity: 0.9, stroke: "#E5E2DA" },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      style: {
        stroke: boundary.isAllowedByConvention ? "#3B82F6" : "#EF4444",
        strokeWidth: 2,
        strokeDasharray: boundary.isAllowedByConvention ? undefined : "5 5",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: boundary.isAllowedByConvention ? "#3B82F6" : "#EF4444",
        width: 15,
        height: 15,
      },
    }));

    return { architectureNodes: nodes, architectureEdges: edges };
  }, [model.architecture]);

  // Build raw nodes & edges for "Module Graph" view
  const { moduleNodes, moduleEdges } = useMemo(() => {
    const nodes: Node<ModuleNodeData>[] = model.dependencyGraph.nodes.map((n) => {
      // Determine role from file path or category
      let role: ModuleNodeData["role"] = "shared-utils";
      const p = (n.data.filePath || n.id).toLowerCase();

      if (n.type === "package") {
        role = "package";
      } else if (p.includes("/ui/") || p.includes("components/ui")) {
        role = "ui";
      } else if (p.includes("/api/") || p.includes("route.ts") || p.includes("pages/api")) {
        role = "server";
      } else if (p.includes("database") || p.includes("db") || p.includes("schema")) {
        role = "infrastructure";
      } else if (p.includes("features/") || p.includes("modules/")) {
        role = "features";
      }

      return {
        id: n.id,
        type: "moduleNode",
        position: { x: 0, y: 0 },
        data: {
          label: n.label,
          filePath: n.data.filePath || n.id,
          role,
          linesOfCode: n.data.linesOfCode,
          componentCount: n.data.componentCount,
          inDegree: n.data.inDegree,
          outDegree: n.data.outDegree,
          isExternal: n.type === "package",
        },
      };
    });

    const edges: Edge[] = model.dependencyGraph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      style: { stroke: "#D5D1C8", strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#8B8881",
        width: 12,
        height: 12,
      },
    }));

    return { moduleNodes: nodes, moduleEdges: edges };
  }, [model.dependencyGraph]);

  // Filter nodes based on view mode, role filter, and search query
  const { nodes: activeNodes, edges: activeEdges } = useMemo(() => {
    if (viewMode === "architecture") {
      let filtered = architectureNodes;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.map((node) => {
          const match =
            node.data.layer.name.toLowerCase().includes(q) ||
            node.data.layer.role.toLowerCase().includes(q) ||
            node.data.layer.evidence.toLowerCase().includes(q);
          return {
            ...node,
            data: {
              ...node.data,
              isHighlighted: match,
            },
          };
        });
      }
      return getLayoutedElements(filtered, architectureEdges, direction);
    } else {
      let filtered = moduleNodes;

      // Filter by role
      if (filterRole !== "all") {
        filtered = filtered.filter((n) => n.data.role === filterRole);
      }

      const activeNodeIds = new Set(filtered.map((n) => n.id));

      // Filter edges to only those connecting active nodes
      const filteredEdges = moduleEdges.filter(
        (e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target),
      );

      // Search highlighting
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.map((node) => {
          const match =
            node.data.label.toLowerCase().includes(q) ||
            node.data.filePath.toLowerCase().includes(q);
          return {
            ...node,
            data: {
              ...node.data,
              isHighlighted: match,
            },
          };
        });
      }

      return getLayoutedElements(filtered, filteredEdges, direction);
    }
  }, [
    viewMode,
    architectureNodes,
    architectureEdges,
    moduleNodes,
    moduleEdges,
    filterRole,
    searchQuery,
    direction,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(activeNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(activeEdges);

  // Sync state whenever activeNodes/activeEdges update
  useEffect(() => {
    setNodes(activeNodes as Node[]);
    setEdges(activeEdges);
    // Fit view after layout update
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [activeNodes, activeEdges, setNodes, setEdges, fitView]);

  // Node selection handler
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleSelectNodeById = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      const target = getNode(nodeId);
      if (target) {
        setCenter(target.position.x + 120, target.position.y + 40, {
          duration: 600,
          zoom: 1.2,
        });
      }
    },
    [getNode, setCenter],
  );

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, nodes]);

  const handleResetLayout = useCallback(() => {
    fitView({ padding: 0.2, duration: 500 });
  }, [fitView]);

  const handleDirectionToggle = useCallback(() => {
    setDirection((prev) => (prev === "TB" ? "LR" : "TB"));
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-background">
      {/* Top Controls Toolbar */}
      <ExplorerToolbar
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          setSelectedNodeId(null);
        }}
        selectedFilter={filterRole}
        onFilterChange={setFilterRole}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        direction={direction}
        onDirectionToggle={handleDirectionToggle}
        onResetLayout={handleResetLayout}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

      {/* Canvas Area with Inspector */}
      <div className="relative flex-1 w-full h-full flex overflow-hidden">
        <div className="flex-1 h-full w-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2.5}
            defaultEdgeOptions={{ type: "smoothstep" }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#D5D1C8" gap={20} size={1} />
            <Controls className="!bg-surface !border !border-border !shadow-subtle !rounded-md" />
            <MiniMap
              className="!bg-surface/90 !border !border-border !rounded-md !shadow-subtle hidden sm:block"
              nodeColor={(n) => {
                if (n.type === "layerNode") return "#3B82F6";
                return "#F59E0B";
              }}
              maskColor="rgba(248, 247, 243, 0.7)"
            />
          </ReactFlow>
        </div>

        {/* Slide-over Inspector Drawer */}
        {selectedNode && (
          <NodeInspector
            selectedNode={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onSelectNodeById={handleSelectNodeById}
            dependencyGraph={model.dependencyGraph}
            architecture={model.architecture}
          />
        )}
      </div>
    </div>
  );
}

export function ArchitectureCanvas({ model }: ArchitectureCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerArchitectureCanvas model={model} />
    </ReactFlowProvider>
  );
}

import dagre from "@dagrejs/dagre";
import { Position, type Node, type Edge } from "@xyflow/react";

export type LayoutDirection = "TB" | "LR";

const NODE_WIDTH = 240;
const NODE_HEIGHT = 80;
const LAYER_NODE_WIDTH = 280;
const LAYER_NODE_HEIGHT = 120;

/**
 * Calculates hierarchical node positions using dagre layout.
 */
export function getLayoutedElements<TNodeData extends Record<string, unknown>>(
  nodes: Node<TNodeData>[],
  edges: Edge[],
  direction: LayoutDirection = "TB",
): { nodes: Node<TNodeData>[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 50,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  // Add nodes to dagre
  for (const node of nodes) {
    const isLayerNode = node.type === "layerNode";
    const width = isLayerNode ? LAYER_NODE_WIDTH : NODE_WIDTH;
    const height = isLayerNode ? LAYER_NODE_HEIGHT : NODE_HEIGHT;
    dagreGraph.setNode(node.id, { width, height });
  }

  // Add edges to dagre
  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions
  const layoutedNodes: Node<TNodeData>[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const isLayerNode = node.type === "layerNode";
    const width = isLayerNode ? LAYER_NODE_WIDTH : NODE_WIDTH;
    const height = isLayerNode ? LAYER_NODE_HEIGHT : NODE_HEIGHT;

    // Shift coordinates so node origin is top-left
    const x = nodeWithPosition.x - width / 2;
    const y = nodeWithPosition.y - height / 2;

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x, y },
    };
  });

  return { nodes: layoutedNodes, edges };
}

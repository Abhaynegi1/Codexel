import path from "node:path";
import type { DependencyGraph, GraphNode, GraphEdge, FileMetadata } from "@codexel/shared";
import { DependencyGraphSchema } from "@codexel/shared";
import type { FileAstSummary } from "./ast-walker";
import type { AliasResolver } from "./alias-resolver";

/**
 * Builds the module dependency graph (nodes and edges) from AST summaries.
 */
export function buildDependencyGraph(
  files: FileMetadata[],
  astSummaries: Map<string, FileAstSummary>,
  resolver: AliasResolver,
): DependencyGraph {
  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();
  const inDegreeMap = new Map<string, number>();
  const outDegreeMap = new Map<string, number>();

  // 1. Initialize file nodes
  for (const file of files) {
    nodeMap.set(file.path, {
      id: file.path,
      label: path.basename(file.path),
      type: "file",
      category: file.isSource ? "source" : file.isConfig ? "config" : "asset",
      data: {
        filePath: file.path,
        linesOfCode: file.linesOfCode,
        componentCount: 0,
        inDegree: 0,
        outDegree: 0,
      },
    });
    inDegreeMap.set(file.path, 0);
    outDegreeMap.set(file.path, 0);
  }

  // 2. Build edges from AST imports
  for (const [sourcePath, summary] of astSummaries.entries()) {
    for (const imp of summary.imports) {
      const resolved = resolver.resolve(imp.specifier, sourcePath);

      let targetId: string | null = null;

      if (!resolved.isExternal && resolved.resolvedPath) {
        targetId = resolved.resolvedPath;
        // If target file not yet in nodeMap, add it
        if (!nodeMap.has(targetId)) {
          nodeMap.set(targetId, {
            id: targetId,
            label: path.basename(targetId),
            type: "file",
            data: {
              filePath: targetId,
              linesOfCode: 0,
              componentCount: 0,
              inDegree: 0,
              outDegree: 0,
            },
          });
          inDegreeMap.set(targetId, 0);
          outDegreeMap.set(targetId, 0);
        }
      } else if (resolved.isExternal && resolved.packageName) {
        targetId = `package:${resolved.packageName}`;
        if (!nodeMap.has(targetId)) {
          nodeMap.set(targetId, {
            id: targetId,
            label: resolved.packageName,
            type: "package",
            category: "external",
            data: {
              inDegree: 0,
              outDegree: 0,
            },
          });
          inDegreeMap.set(targetId, 0);
          outDegreeMap.set(targetId, 0);
        }
      }

      if (targetId && targetId !== sourcePath) {
        const edgeId = `edge:${sourcePath}->${targetId}`;
        const existing = edgeMap.get(edgeId);

        if (existing) {
          // Merge specifiers
          const combined = Array.from(
            new Set([...(existing.specifiers || []), ...imp.importedNames]),
          );
          existing.specifiers = combined;
        } else {
          edgeMap.set(edgeId, {
            id: edgeId,
            source: sourcePath,
            target: targetId,
            type: "imports",
            specifiers: imp.importedNames.length > 0 ? imp.importedNames : undefined,
          });

          // Track degrees
          outDegreeMap.set(sourcePath, (outDegreeMap.get(sourcePath) || 0) + 1);
          inDegreeMap.set(targetId, (inDegreeMap.get(targetId) || 0) + 1);
        }
      }
    }
  }

  // 3. Assign degrees back to nodes
  for (const node of nodeMap.values()) {
    node.data.inDegree = inDegreeMap.get(node.id) || 0;
    node.data.outDegree = outDegreeMap.get(node.id) || 0;
  }

  const nodes = Array.from(nodeMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  const edges = Array.from(edgeMap.values()).sort((a, b) => a.id.localeCompare(b.id));

  const graph: DependencyGraph = { nodes, edges };
  return DependencyGraphSchema.parse(graph);
}

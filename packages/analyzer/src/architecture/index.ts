import path from "node:path";
import type {
  ArchitectureSummary,
  ArchitectureLayer,
  ModuleBoundary,
  FileMetadata,
  DependencyGraph,
  RouteInventory,
  ComponentInventory,
} from "@codexel/shared";
import { ArchitectureSummarySchema } from "@codexel/shared";

export interface ClassifyArchitectureParams {
  workspacePath: string;
  files?: FileMetadata[];
  dependencyGraph?: DependencyGraph;
  routes?: RouteInventory;
  components?: ComponentInventory;
}

interface LayerRule {
  id: string;
  name: string;
  role: ArchitectureLayer["role"];
  matchPatterns: RegExp[];
  evidence: string;
  defaultConfidence: number;
}

const LAYER_RULES: LayerRule[] = [
  {
    id: "layer:server",
    name: "Server & APIs",
    role: "server",
    matchPatterns: [
      /(?:^|[\\/])(?:app[\\/]api|pages[\\/]api|server|api|trpc|routes[\\/]api)(?:[\\/]|$)/i,
      /(?:^|[\\/])(?:route\.(?:ts|js)|server\.(?:ts|js))/i,
    ],
    evidence: "Contains API route handlers, endpoints, and server controllers",
    defaultConfidence: 0.95,
  },
  {
    id: "layer:infrastructure",
    name: "Data & Infrastructure",
    role: "infrastructure",
    matchPatterns: [
      /(?:^|[\\/])(?:database|db|prisma|drizzle|models|entities|migrations)(?:[\\/]|$)/i,
      /(?:^|[\\/])schema\.(?:ts|js|prisma)/i,
    ],
    evidence:
      "Contains database schemas, ORM models, or infrastructure clients",
    defaultConfidence: 0.95,
  },
  {
    id: "layer:ui",
    name: "UI Primitives & Design System",
    role: "ui",
    matchPatterns: [
      /(?:^|[\\/])components[\\/](?:ui|primitives|common|atoms|elements)(?:[\\/]|$)/i,
      /(?:^|[\\/])(?:design-system|theme|styles)(?:[\\/]|$)/i,
    ],
    evidence:
      "Contains reusable UI primitives, design tokens, and base components",
    defaultConfidence: 0.9,
  },
  {
    id: "layer:features",
    name: "Feature Domains",
    role: "features",
    matchPatterns: [
      /(?:^|[\\/])(?:features|modules|views|screens|pages|app\/(?!\(?api\)?))(?:[\\/]|$)/i,
      /(?:^|[\\/])components[\\/](?!ui|primitives)(?:[\\/]|$)/i,
    ],
    evidence:
      "Contains domain-specific user features, screens, and application workflows",
    defaultConfidence: 0.85,
  },
  {
    id: "layer:shared-utils",
    name: "Shared Utilities & Helpers",
    role: "shared-utils",
    matchPatterns: [
      /(?:^|[\\/])(?:lib|utils|helpers|hooks|types|services|config)(?:[\\/]|$)/i,
    ],
    evidence:
      "Contains cross-cutting helper utilities, shared hooks, and shared type definitions",
    defaultConfidence: 0.85,
  },
];

function isBoundaryAllowed(
  sourceRole: ArchitectureLayer["role"],
  targetRole: ArchitectureLayer["role"],
): boolean {
  if (sourceRole === targetRole) return true;

  if (
    sourceRole === "infrastructure" &&
    (targetRole === "ui" || targetRole === "features")
  ) {
    return false;
  }

  if (
    sourceRole === "ui" &&
    (targetRole === "infrastructure" || targetRole === "server")
  ) {
    return false;
  }

  if (
    sourceRole === "shared-utils" &&
    (targetRole === "features" || targetRole === "server")
  ) {
    return false;
  }

  return true;
}

export async function classifyArchitecture(
  workspacePathOrParams: string | ClassifyArchitectureParams,
  files?: FileMetadata[],
  dependencyGraph?: DependencyGraph,
  routes?: RouteInventory,
  components?: ComponentInventory,
): Promise<ArchitectureSummary> {
  let workspacePath: string;
  let allFiles: FileMetadata[] = [];
  let depGraph: DependencyGraph | undefined;

  if (typeof workspacePathOrParams === "string") {
    workspacePath = workspacePathOrParams;
    allFiles = files || [];
    depGraph = dependencyGraph;
  } else {
    workspacePath = workspacePathOrParams.workspacePath;
    allFiles = workspacePathOrParams.files || [];
    depGraph = workspacePathOrParams.dependencyGraph;
    routes = workspacePathOrParams.routes;
    components = workspacePathOrParams.components;
  }

  const sourceFiles = allFiles.filter((f) => f.isSource);
  const fileToLayerMap = new Map<string, string>();
  const layerBuckets = new Map<
    string,
    {
      rule: LayerRule;
      matchedFiles: FileMetadata[];
      directories: Set<string>;
    }
  >();

  for (const rule of LAYER_RULES) {
    layerBuckets.set(rule.id, {
      rule,
      matchedFiles: [],
      directories: new Set<string>(),
    });
  }

  const unassignedFiles: FileMetadata[] = [];

  for (const file of sourceFiles) {
    const normPath = file.path.replace(/\\/g, "/");
    let matched = false;

    for (const rule of LAYER_RULES) {
      if (rule.matchPatterns.some((pattern) => pattern.test(normPath))) {
        const bucket = layerBuckets.get(rule.id)!;
        bucket.matchedFiles.push(file);
        const dir = path.dirname(file.path).replace(/\\/g, "/");
        bucket.directories.add(dir === "." ? "" : dir);
        fileToLayerMap.set(file.path, rule.id);
        matched = true;
        break;
      }
    }

    if (!matched) {
      unassignedFiles.push(file);
    }
  }

  if (unassignedFiles.length > 0) {
    const sharedBucket = layerBuckets.get("layer:shared-utils")!;
    for (const file of unassignedFiles) {
      sharedBucket.matchedFiles.push(file);
      const dir = path.dirname(file.path).replace(/\\/g, "/");
      sharedBucket.directories.add(dir === "." ? "" : dir);
      fileToLayerMap.set(file.path, "layer:shared-utils");
    }
  }

  const activeLayers: ArchitectureLayer[] = [];
  const layerRoleMap = new Map<string, ArchitectureLayer["role"]>();

  for (const [layerId, bucket] of layerBuckets.entries()) {
    if (bucket.matchedFiles.length > 0) {
      const isConfirmed =
        bucket.matchedFiles.length >= 2 || bucket.directories.size > 0;
      activeLayers.push({
        id: layerId,
        name: bucket.rule.name,
        role: bucket.rule.role,
        directoryPaths: Array.from(bucket.directories).sort(),
        fileCount: bucket.matchedFiles.length,
        isConfirmedFact: isConfirmed,
        confidenceScore: bucket.rule.defaultConfidence,
        evidence: `${bucket.rule.evidence} (${bucket.matchedFiles.length} files detected in ${bucket.directories.size || 1} directories)`,
      });
      layerRoleMap.set(layerId, bucket.rule.role);
    }
  }

  if (activeLayers.length === 0) {
    activeLayers.push({
      id: "layer:root",
      name: "Root Application",
      role: "unknown",
      directoryPaths: ["."],
      fileCount: allFiles.length,
      isConfirmedFact: true,
      confidenceScore: 1.0,
      evidence: "Root repository directory",
    });
    layerRoleMap.set("layer:root", "unknown");
  }

  const boundaryCounter = new Map<string, number>();

  if (depGraph && depGraph.edges.length > 0) {
    for (const edge of depGraph.edges) {
      const srcLayer = fileToLayerMap.get(edge.source);
      const targetLayer = fileToLayerMap.get(edge.target);

      if (srcLayer && targetLayer && srcLayer !== targetLayer) {
        const key = `${srcLayer}->${targetLayer}`;
        boundaryCounter.set(key, (boundaryCounter.get(key) || 0) + 1);
      }
    }
  }

  const boundaries: ModuleBoundary[] = [];
  for (const [key, count] of boundaryCounter.entries()) {
    const parts = key.split("->");
    const sourceLayerId = parts[0];
    const targetLayerId = parts[1];

    if (!sourceLayerId || !targetLayerId) continue;

    const sourceRole = layerRoleMap.get(sourceLayerId) || "unknown";
    const targetRole = layerRoleMap.get(targetLayerId) || "unknown";

    boundaries.push({
      sourceLayerId,
      targetLayerId,
      importCount: count,
      isAllowedByConvention: isBoundaryAllowed(sourceRole, targetRole),
    });
  }

  activeLayers.sort((a, b) => a.name.localeCompare(b.name));
  boundaries.sort((a, b) =>
    a.sourceLayerId === b.sourceLayerId
      ? a.targetLayerId.localeCompare(b.targetLayerId)
      : a.sourceLayerId.localeCompare(b.sourceLayerId),
  );

  const summary: ArchitectureSummary = {
    layers: activeLayers,
    boundaries,
  };

  return ArchitectureSummarySchema.parse(summary);
}

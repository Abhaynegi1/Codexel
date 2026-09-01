import { z } from "zod";

export const TechnologyTagSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  category: z.enum([
    "framework",
    "styling",
    "database",
    "state",
    "ui-library",
    "tooling",
    "testing",
  ]),
  evidence: z.object({
    filePath: z.string(),
    matchedPackage: z.string().optional(),
    description: z.string(),
  }),
});

export const TechnologyStackSchema = z.object({
  primaryLanguage: z.string(),
  languages: z.array(
    z.object({
      name: z.string(),
      percentage: z.number().min(0).max(100),
      fileCount: z.number().int().nonnegative(),
    }),
  ),
  frameworks: z.array(TechnologyTagSchema),
  styling: z.array(TechnologyTagSchema),
  database: z.array(TechnologyTagSchema),
  stateManagement: z.array(TechnologyTagSchema),
  uiLibraries: z.array(TechnologyTagSchema),
  buildTools: z.array(TechnologyTagSchema),
});

export const FileMetadataSchema = z.object({
  path: z.string(),
  extension: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  linesOfCode: z.number().int().nonnegative(),
  isSource: z.boolean(),
  isConfig: z.boolean(),
});

export const FileSystemSummarySchema = z.object({
  totalFiles: z.number().int().nonnegative(),
  totalDirectories: z.number().int().nonnegative(),
  totalLinesOfCode: z.number().int().nonnegative(),
  rootDirectories: z.array(z.string()),
  ignoredCount: z.number().int().nonnegative(),
  files: z.array(FileMetadataSchema),
});

export const ArchitectureLayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum([
    "ui",
    "features",
    "server",
    "infrastructure",
    "shared-utils",
    "unknown",
  ]),
  directoryPaths: z.array(z.string()),
  fileCount: z.number().int().nonnegative(),
  isConfirmedFact: z.boolean(),
  confidenceScore: z.number().min(0).max(1),
  evidence: z.string(),
});

export const ModuleBoundarySchema = z.object({
  sourceLayerId: z.string(),
  targetLayerId: z.string(),
  importCount: z.number().int().nonnegative(),
  isAllowedByConvention: z.boolean(),
});

export const ArchitectureSummarySchema = z.object({
  layers: z.array(ArchitectureLayerSchema),
  boundaries: z.array(ModuleBoundarySchema),
});

export const ComponentPropSchema = z.object({
  name: z.string(),
  type: z.string(),
  isRequired: z.boolean(),
  defaultValue: z.string().optional(),
});

export const DiscoveredComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  filePath: z.string(),
  lineStart: z.number().int().positive(),
  lineEnd: z.number().int().positive(),
  isDefaultExport: z.boolean(),
  exportName: z.string(),
  category: z.enum([
    "ui-primitive",
    "shared-component",
    "feature-component",
    "page",
    "layout",
    "form",
    "modal",
    "navigation",
    "table",
    "chart",
    "unknown",
  ]),
  props: z.array(ComponentPropSchema),
  childComponents: z.array(z.string()),
  usedBy: z.array(
    z.object({
      filePath: z.string(),
      componentName: z.string().optional(),
    }),
  ),
  localDependencies: z.array(z.string()),
  externalPackageDependencies: z.array(z.string()),
});

export const ComponentInventorySchema = z.object({
  totalComponents: z.number().int().nonnegative(),
  components: z.array(DiscoveredComponentSchema),
});

export const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["file", "directory", "package", "boundary"]),
  category: z.string().optional(),
  data: z.object({
    filePath: z.string().optional(),
    linesOfCode: z.number().optional(),
    componentCount: z.number().optional(),
    inDegree: z.number().optional(),
    outDegree: z.number().optional(),
  }),
});

export const GraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.enum(["imports", "renders", "calls"]),
  specifiers: z.array(z.string()).optional(),
});

export const DependencyGraphSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
});

export const RouteEntrySchema = z.object({
  routePath: z.string(),
  filePath: z.string(),
  kind: z.enum(["page", "api", "layout"]),
  httpMethods: z
    .array(z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]))
    .optional(),
});

export const RouteInventorySchema = z.object({
  routerType: z.enum([
    "next-app-router",
    "next-pages-router",
    "react-router",
    "express",
    "unknown",
  ]),
  routes: z.array(RouteEntrySchema),
});

export const DesignSystemSummarySchema = z.object({
  colorPalette: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      source: z.enum(["css-variable", "tailwind-config", "theme-object"]),
    }),
  ),
  typography: z.object({
    fontFamilies: z.array(z.string()),
    fontSizes: z.array(z.string()),
    fontWeights: z.array(z.string()),
  }),
  spacing: z.array(z.string()),
  borderRadii: z.array(z.string()),
  detectedCssVariables: z.record(z.string()),
  topTailwindClasses: z.array(
    z.object({
      className: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
  libraries: z.object({
    uiPrimitiveLibrary: z.string().optional(),
    iconLibrary: z.string().optional(),
    animationLibrary: z.string().optional(),
  }),
});

export const AnalysisExecutionStatsSchema = z.object({
  engineVersion: z.string(),
  totalDurationMs: z.number().nonnegative(),
  timings: z.object({
    cloningMs: z.number().nonnegative(),
    scanningMs: z.number().nonnegative(),
    astParsingMs: z.number().nonnegative(),
    graphBuildingMs: z.number().nonnegative(),
    designExtractionMs: z.number().nonnegative(),
  }),
  peakMemoryMb: z.number().nonnegative(),
});

export const RepositoryModelSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  metadata: z.object({
    url: z.string().url(),
    owner: z.string(),
    name: z.string(),
    defaultBranch: z.string(),
    commitSha: z.string(),
    commitDate: z.string().optional(),
    isPrivate: z.boolean(),
    analyzedAt: z.string(),
  }),
  technologyStack: TechnologyStackSchema,
  fileSystem: FileSystemSummarySchema,
  architecture: ArchitectureSummarySchema,
  components: ComponentInventorySchema,
  dependencyGraph: DependencyGraphSchema,
  routes: RouteInventorySchema,
  designSystem: DesignSystemSummarySchema,
  analysisStats: AnalysisExecutionStatsSchema,
});

export const ParsedGitHubUrlSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  cleanUrl: z.string().url(),
  cloneUrl: z.string().url(),
  ref: z.string().optional(),
  subpath: z.string().optional(),
});

export const IngestionLimitsSchema = z.object({
  maxFiles: z.number().int().positive().default(10_000),
  maxSizeBytes: z
    .number()
    .int()
    .positive()
    .default(150 * 1024 * 1024),
  fetchTimeoutMs: z.number().int().positive().default(60_000),
  remoteTimeoutMs: z.number().int().positive().default(30_000),
});

export const RemoteRepoInfoSchema = z.object({
  commitSha: z.string().min(7),
  defaultBranch: z.string().min(1),
  resolvedRef: z.string().min(1),
  cacheKey: z.string().min(1),
});

export const SandboxMetadataSchema = z.object({
  ephemeralPath: z.string(),
  owner: z.string(),
  repo: z.string(),
  commitSha: z.string(),
  defaultBranch: z.string(),
  fileCount: z.number().int().nonnegative(),
  sizeBytes: z.number().int().nonnegative(),
  clonedAt: z.string(),
  cloneDurationMs: z.number().nonnegative(),
});

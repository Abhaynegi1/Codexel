export interface RepositoryMetadata {
  url: string;
  owner: string;
  name: string;
  defaultBranch: string;
  commitSha: string;
  commitDate?: string;
  isPrivate: boolean;
  analyzedAt: string;
}

export interface TechnologyTag {
  name: string;
  version?: string;
  category:
    | "framework"
    | "styling"
    | "database"
    | "state"
    | "ui-library"
    | "tooling"
    | "testing";
  evidence: {
    filePath: string;
    matchedPackage?: string;
    description: string;
  };
}

export interface TechnologyStack {
  primaryLanguage: string;
  languages: Array<{
    name: string;
    percentage: number;
    fileCount: number;
  }>;
  frameworks: TechnologyTag[];
  styling: TechnologyTag[];
  database: TechnologyTag[];
  stateManagement: TechnologyTag[];
  uiLibraries: TechnologyTag[];
  buildTools: TechnologyTag[];
}

export interface FileMetadata {
  path: string;
  extension: string;
  sizeBytes: number;
  linesOfCode: number;
  isSource: boolean;
  isConfig: boolean;
}

export interface FileSystemSummary {
  totalFiles: number;
  totalDirectories: number;
  totalLinesOfCode: number;
  rootDirectories: string[];
  ignoredCount: number;
  files: FileMetadata[];
}

export interface ArchitectureLayer {
  id: string;
  name: string;
  role:
    | "ui"
    | "features"
    | "server"
    | "infrastructure"
    | "shared-utils"
    | "unknown";
  directoryPaths: string[];
  fileCount: number;
  isConfirmedFact: boolean;
  confidenceScore: number;
  evidence: string;
}

export interface ModuleBoundary {
  sourceLayerId: string;
  targetLayerId: string;
  importCount: number;
  isAllowedByConvention: boolean;
}

export interface ArchitectureSummary {
  layers: ArchitectureLayer[];
  boundaries: ModuleBoundary[];
}

export interface ComponentProp {
  name: string;
  type: string;
  isRequired: boolean;
  defaultValue?: string;
}

export interface DiscoveredComponent {
  id: string;
  name: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  isDefaultExport: boolean;
  exportName: string;
  category:
    | "ui-primitive"
    | "shared-component"
    | "feature-component"
    | "page"
    | "layout"
    | "form"
    | "modal"
    | "navigation"
    | "table"
    | "chart"
    | "unknown";
  props: ComponentProp[];
  childComponents: string[];
  usedBy: Array<{
    filePath: string;
    componentName?: string;
  }>;
  localDependencies: string[];
  externalPackageDependencies: string[];
}

export interface ComponentInventory {
  totalComponents: number;
  components: DiscoveredComponent[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: "file" | "directory" | "package" | "boundary";
  category?: string;
  data: {
    filePath?: string;
    linesOfCode?: number;
    componentCount?: number;
    inDegree?: number;
    outDegree?: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "imports" | "renders" | "calls";
  specifiers?: string[];
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RouteEntry {
  routePath: string;
  filePath: string;
  kind: "page" | "api" | "layout";
  httpMethods?: Array<"GET" | "POST" | "PUT" | "DELETE" | "PATCH">;
}

export interface RouteInventory {
  routerType:
    | "next-app-router"
    | "next-pages-router"
    | "react-router"
    | "express"
    | "unknown";
  routes: RouteEntry[];
}

export interface DesignTokenColor {
  name: string;
  value: string;
  source: "css-variable" | "tailwind-config" | "theme-object";
}

export interface DesignSystemSummary {
  colorPalette: DesignTokenColor[];
  typography: {
    fontFamilies: string[];
    fontSizes: string[];
    fontWeights: string[];
  };
  spacing: string[];
  borderRadii: string[];
  detectedCssVariables: Record<string, string>;
  topTailwindClasses: Array<{
    className: string;
    count: number;
  }>;
  libraries: {
    uiPrimitiveLibrary?: string;
    iconLibrary?: string;
    animationLibrary?: string;
  };
}

export interface AnalysisExecutionStats {
  engineVersion: string;
  totalDurationMs: number;
  timings: {
    cloningMs: number;
    scanningMs: number;
    astParsingMs: number;
    graphBuildingMs: number;
    designExtractionMs: number;
  };
  peakMemoryMb: number;
}

export interface RepositoryModel {
  schemaVersion: "1.0.0";
  metadata: RepositoryMetadata;
  technologyStack: TechnologyStack;
  fileSystem: FileSystemSummary;
  architecture: ArchitectureSummary;
  components: ComponentInventory;
  dependencyGraph: DependencyGraph;
  routes: RouteInventory;
  designSystem: DesignSystemSummary;
  analysisStats: AnalysisExecutionStats;
}

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  cleanUrl: string;
  cloneUrl: string;
  ref?: string;
  subpath?: string;
}

export interface IngestionLimits {
  maxFiles: number;
  maxSizeBytes: number;
  fetchTimeoutMs: number;
  remoteTimeoutMs: number;
}

export interface RemoteRepoInfo {
  commitSha: string;
  defaultBranch: string;
  resolvedRef: string;
  cacheKey: string;
}

export interface SandboxMetadata {
  ephemeralPath: string;
  owner: string;
  repo: string;
  commitSha: string;
  defaultBranch: string;
  fileCount: number;
  sizeBytes: number;
  clonedAt: string;
  cloneDurationMs: number;
}

# Codexel — Repository Intelligence Model (Data Contract)

> **Schema Version**: `1.0.0`  
> **Status**: Canonical Contract  
> **Package**: `@codexel/shared` / `packages/shared/src/model.ts`

The **Repository Intelligence Model** is the primary contract connecting the deterministic analysis engine (`packages/analyzer`) with storage (`PostgreSQL / Drizzle`) and the user interface (`apps/web`).

Every analysis produces a validated instance of this model. It is fully serializable as JSON, strictly typed with TypeScript, and validated using Zod.

---

## 1. Top-Level Model Structure

```typescript
export interface RepositoryModel {
  /** Schema specification version for backwards compatibility */
  schemaVersion: "1.0.0";

  /** Repository metadata and commit identification */
  metadata: RepositoryMetadata;

  /** Detected frameworks, languages, runtime and tooling */
  technologyStack: TechnologyStack;

  /** Aggregate file statistics and directory structure */
  fileSystem: FileSystemSummary;

  /** High-level architectural layers and module boundaries */
  architecture: ArchitectureSummary;

  /** Inventory of discovered components, props, and usages */
  components: ComponentInventory;

  /** Directional dependency graph (files, modules, packages) */
  dependencyGraph: DependencyGraph;

  /** Discovered routing endpoints and page hierarchies */
  routes: RouteInventory;

  /** Extracted design system, tokens, colors, and typography */
  designSystem: DesignSystemSummary;

  /** Analysis execution statistics (timings, engine version) */
  analysisStats: AnalysisExecutionStats;
}
```

---

## 2. Detailed Sub-Schemas

### 2.1. Metadata (`metadata`)

```typescript
export interface RepositoryMetadata {
  /** Canonical Git URL (e.g. 'https://github.com/owner/repo') */
  url: string;
  owner: string;
  name: string;
  defaultBranch: string;
  /** Exact commit SHA that this model represents */
  commitSha: string;
  /** Optional commit timestamp */
  commitDate?: string;
  isPrivate: boolean;
  analyzedAt: string; // ISO 8601 string
}
```

---

### 2.2. Technology Stack (`technologyStack`)

```typescript
export interface TechnologyStack {
  primaryLanguage: string;
  languages: Array<{
    name: string;
    percentage: number; // 0 - 100
    fileCount: number;
  }>;
  frameworks: Array<TechnologyTag>;
  styling: Array<TechnologyTag>;
  database: Array<TechnologyTag>;
  stateManagement: Array<TechnologyTag>;
  uiLibraries: Array<TechnologyTag>;
  buildTools: Array<TechnologyTag>;
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
```

---

### 2.3. File System (`fileSystem`)

```typescript
export interface FileSystemSummary {
  totalFiles: number;
  totalDirectories: number;
  totalLinesOfCode: number;
  rootDirectories: string[];
  /** Compact representation of ignored paths */
  ignoredCount: number;
  /** File nodes cataloged in the repository */
  files: Array<{
    path: string; // Relative to repository root
    extension: string;
    sizeBytes: number;
    linesOfCode: number;
    isSource: boolean;
    isConfig: boolean;
  }>;
}
```

---

### 2.4. Architecture (`architecture`)

Distinguishes between direct facts and heuristic inferences:

```typescript
export interface ArchitectureSummary {
  layers: ArchitectureLayer[];
  boundaries: ModuleBoundary[];
}

export interface ArchitectureLayer {
  id: string;
  name: string; // e.g. "Presentation", "Domain Features", "Server / API", "Data Layer"
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
  confidenceScore: number; // 0.0 to 1.0
  evidence: string;
}

export interface ModuleBoundary {
  sourceLayerId: string;
  targetLayerId: string;
  importCount: number;
  isAllowedByConvention: boolean;
}
```

---

### 2.5. Component Inventory (`components`)

```typescript
export interface ComponentInventory {
  totalComponents: number;
  components: DiscoveredComponent[];
}

export interface DiscoveredComponent {
  id: string; // Unique component ID (e.g. 'src/components/ui/Button.tsx:Button')
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

  /** Declared props interface or types */
  props: Array<{
    name: string;
    type: string;
    isRequired: boolean;
    defaultValue?: string;
  }>;

  /** Components rendered in JSX by this component */
  childComponents: string[]; // List of component names

  /** Other components that import/render this component */
  usedBy: Array<{
    filePath: string;
    componentName?: string;
  }>;

  /** Immediate local file dependencies for closure extraction */
  localDependencies: string[];

  /** Required external npm packages */
  externalPackageDependencies: string[];
}
```

---

### 2.6. Dependency Graph (`dependencyGraph`)

Graph format optimized for React Flow visualization:

```typescript
export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string; // File path or module ID
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
  source: string; // Source Node ID
  target: string; // Target Node ID
  type: "imports" | "renders" | "calls";
  specifiers?: string[]; // Imported symbols, e.g. ['useState', 'Button']
}
```

---

### 2.7. Routes (`routes`)

```typescript
export interface RouteInventory {
  routerType:
    | "next-app-router"
    | "next-pages-router"
    | "react-router"
    | "express"
    | "unknown";
  routes: Array<{
    routePath: string; // e.g. '/dashboard/analytics' or '/api/auth/[...nextauth]'
    filePath: string;
    kind: "page" | "api" | "layout";
    httpMethods?: Array<"GET" | "POST" | "PUT" | "DELETE" | "PATCH">;
  }>;
}
```

---

### 2.8. Design System (`designSystem`)

```typescript
export interface DesignSystemSummary {
  colorPalette: Array<{
    name: string; // e.g. "primary", "background", "accent"
    value: string; // Hex, HSL, or CSS variable name
    source: "css-variable" | "tailwind-config" | "theme-object";
  }>;
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
    uiPrimitiveLibrary?: string; // e.g. "@radix-ui", "@headlessui"
    iconLibrary?: string; // e.g. "lucide-react", "@heroicons/react"
    animationLibrary?: string; // e.g. "framer-motion"
  };
}
```

---

### 2.9. Analysis Stats (`analysisStats`)

```typescript
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
```

---

## 3. Example Serialized Output (Excerpt)

```json
{
  "schemaVersion": "1.0.0",
  "metadata": {
    "url": "https://github.com/shadcn-ui/taxonomy",
    "owner": "shadcn-ui",
    "name": "taxonomy",
    "defaultBranch": "main",
    "commitSha": "9f82ab1c045b3a4e98f01b0a94e80a56d9813b19",
    "isPrivate": false,
    "analyzedAt": "2026-08-31T11:00:00.000Z"
  },
  "technologyStack": {
    "primaryLanguage": "TypeScript",
    "languages": [
      { "name": "TypeScript", "percentage": 88.4, "fileCount": 112 },
      { "name": "CSS", "percentage": 11.6, "fileCount": 4 }
    ],
    "frameworks": [
      {
        "name": "Next.js",
        "version": "^14.0.0",
        "category": "framework",
        "evidence": {
          "filePath": "package.json",
          "matchedPackage": "next",
          "description": "Found Next.js dependency"
        }
      }
    ],
    "styling": [
      {
        "name": "Tailwind CSS",
        "version": "^3.4.0",
        "category": "styling",
        "evidence": {
          "filePath": "tailwind.config.js",
          "description": "Tailwind configuration file detected"
        }
      }
    ],
    "database": [
      {
        "name": "Prisma",
        "version": "^5.0.0",
        "category": "database",
        "evidence": {
          "filePath": "prisma/schema.prisma",
          "description": "Prisma schema detected"
        }
      }
    ],
    "stateManagement": [],
    "uiLibraries": [
      {
        "name": "Radix UI",
        "category": "ui-library",
        "evidence": {
          "filePath": "package.json",
          "description": "Detected multiple @radix-ui/* packages"
        }
      }
    ],
    "buildTools": []
  },
  "fileSystem": {
    "totalFiles": 116,
    "totalDirectories": 18,
    "totalLinesOfCode": 9420,
    "rootDirectories": ["app", "components", "lib", "styles", "prisma"],
    "ignoredCount": 23410,
    "files": []
  },
  "architecture": {
    "layers": [],
    "boundaries": []
  },
  "components": {
    "totalComponents": 34,
    "components": [
      {
        "id": "components/ui/button.tsx:Button",
        "name": "Button",
        "filePath": "components/ui/button.tsx",
        "lineStart": 24,
        "lineEnd": 48,
        "isDefaultExport": false,
        "exportName": "Button",
        "category": "ui-primitive",
        "props": [
          {
            "name": "variant",
            "type": "'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'",
            "isRequired": false,
            "defaultValue": "'default'"
          },
          {
            "name": "size",
            "type": "'default' | 'sm' | 'lg' | 'icon'",
            "isRequired": false,
            "defaultValue": "'default'"
          },
          {
            "name": "asChild",
            "type": "boolean",
            "isRequired": false,
            "defaultValue": "false"
          }
        ],
        "childComponents": ["Slot"],
        "usedBy": [
          {
            "filePath": "components/site-header.tsx",
            "componentName": "SiteHeader"
          },
          {
            "filePath": "components/post-item.tsx",
            "componentName": "PostItem"
          }
        ],
        "localDependencies": ["lib/utils.ts"],
        "externalPackageDependencies": [
          "@radix-ui/react-slot",
          "class-variance-authority",
          "clsx",
          "tailwind-merge"
        ]
      }
    ]
  },
  "dependencyGraph": {
    "nodes": [],
    "edges": []
  },
  "routes": {
    "routerType": "next-app-router",
    "routes": []
  },
  "designSystem": {
    "colorPalette": [
      {
        "name": "primary",
        "value": "hsl(222.2 47.4% 11.2%)",
        "source": "css-variable"
      },
      {
        "name": "primary-foreground",
        "value": "hsl(210 40% 98%)",
        "source": "css-variable"
      }
    ],
    "typography": {
      "fontFamilies": ["Inter", "Cal Sans"],
      "fontSizes": [
        "0.75rem",
        "0.875rem",
        "1rem",
        "1.125rem",
        "1.25rem",
        "1.5rem"
      ],
      "fontWeights": ["400", "500", "600", "700"]
    },
    "spacing": ["0.25rem", "0.5rem", "0.75rem", "1rem", "1.5rem", "2rem"],
    "borderRadii": ["0.25rem", "0.5rem", "0.75rem"],
    "detectedCssVariables": {
      "--background": "0 0% 100%",
      "--foreground": "222.2 84% 4.9%"
    },
    "topTailwindClasses": [
      { "className": "flex", "count": 142 },
      { "className": "items-center", "count": 118 },
      { "className": "justify-between", "count": 64 }
    ],
    "libraries": {
      "uiPrimitiveLibrary": "@radix-ui",
      "iconLibrary": "lucide-react",
      "animationLibrary": "framer-motion"
    }
  },
  "analysisStats": {
    "engineVersion": "1.0.0",
    "totalDurationMs": 2840,
    "timings": {
      "cloningMs": 1100,
      "scanningMs": 140,
      "astParsingMs": 950,
      "graphBuildingMs": 350,
      "designExtractionMs": 300
    },
    "peakMemoryMb": 145
  }
}
```

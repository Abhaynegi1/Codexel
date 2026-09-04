import { describe, it, expect } from "vitest";
import {
  serializeModelToFacts,
  generateDeterministicGroundedResponse,
  PRESET_PROMPTS,
  constructGroundedUserPrompt,
} from "../src/ai/index";
import type { RepositoryModel } from "@codexel/shared";

const mockModel: RepositoryModel = {
  schemaVersion: "1.0.0",
  metadata: {
    url: "https://github.com/acme/widgets",
    owner: "acme",
    name: "widgets",
    defaultBranch: "main",
    commitSha: "a1b2c3d4e5f6",
    isPrivate: false,
    analyzedAt: new Date().toISOString(),
  },
  technologyStack: {
    primaryLanguage: "TypeScript",
    languages: [{ name: "TypeScript", percentage: 100, fileCount: 5 }],
    frameworks: [
      {
        name: "Next.js",
        version: "14.2.0",
        category: "framework",
        evidence: {
          filePath: "package.json",
          description: "Next.js framework",
        },
      },
    ],
    styling: [
      {
        name: "Tailwind CSS",
        version: "3.4.0",
        category: "styling",
        evidence: {
          filePath: "tailwind.config.ts",
          description: "Tailwind styling",
        },
      },
    ],
    database: [],
    stateManagement: [],
    uiLibraries: [
      {
        name: "Radix UI",
        version: "1.1.0",
        category: "ui-library",
        evidence: { filePath: "package.json", description: "Radix Primitives" },
      },
    ],
    buildTools: [],
  },
  fileSystem: {
    totalFiles: 5,
    totalDirectories: 2,
    totalLinesOfCode: 420,
    rootDirectories: ["src"],
    ignoredCount: 10,
    files: [
      {
        path: "src/components/Button.tsx",
        extension: ".tsx",
        sizeBytes: 1200,
        linesOfCode: 45,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/app/api/auth/route.ts",
        extension: ".ts",
        sizeBytes: 800,
        linesOfCode: 30,
        isSource: true,
        isConfig: false,
      },
    ],
  },
  architecture: {
    layers: [
      {
        id: "layer:ui",
        name: "UI Components",
        role: "ui",
        directoryPaths: ["src/components"],
        fileCount: 1,
        isConfirmedFact: true,
        confidenceScore: 0.95,
        evidence: "Contains Button component",
      },
      {
        id: "layer:server",
        name: "Server APIs",
        role: "server",
        directoryPaths: ["src/app/api"],
        fileCount: 1,
        isConfirmedFact: true,
        confidenceScore: 0.9,
        evidence: "Contains auth endpoint",
      },
    ],
    boundaries: [
      {
        sourceLayerId: "layer:server",
        targetLayerId: "layer:ui",
        importCount: 0,
        isAllowedByConvention: true,
      },
    ],
  },
  components: {
    totalComponents: 1,
    components: [
      {
        id: "src/components/Button.tsx:Button",
        name: "Button",
        filePath: "src/components/Button.tsx",
        lineStart: 5,
        lineEnd: 45,
        isDefaultExport: true,
        exportName: "default",
        category: "ui-primitive",
        props: [{ name: "variant", type: "string", isRequired: false }],
        childComponents: [],
        usedBy: [],
        localDependencies: [],
        externalPackageDependencies: ["clsx"],
      },
    ],
  },
  dependencyGraph: {
    nodes: [],
    edges: [],
  },
  routes: {
    routerType: "next-app-router",
    routes: [
      {
        routePath: "/api/auth",
        filePath: "src/app/api/auth/route.ts",
        kind: "api",
        httpMethods: ["POST"],
      },
    ],
  },
  designSystem: {
    colorPalette: [
      { name: "primary", value: "#3b82f6", source: "tailwind-config" },
    ],
    typography: {
      fontFamilies: ["Inter"],
      fontSizes: ["14px", "16px"],
      fontWeights: ["400", "600"],
    },
    spacing: ["4px", "8px"],
    borderRadii: ["4px"],
    detectedCssVariables: { "--primary": "222.2 47.4% 11.2%" },
    topTailwindClasses: [{ className: "px-4", count: 12 }],
    libraries: {
      uiPrimitiveLibrary: "Radix UI",
      iconLibrary: "Lucide React",
    },
  },
  analysisStats: {
    engineVersion: "1.0.0",
    totalDurationMs: 120,
    timings: {
      cloningMs: 0,
      scanningMs: 20,
      astParsingMs: 50,
      graphBuildingMs: 30,
      designExtractionMs: 20,
    },
    peakMemoryMb: 50,
  },
};

describe("Phase 9: Grounded AI Layer", () => {
  it("serializes repository model into structured facts with citations", () => {
    const facts = serializeModelToFacts(mockModel);

    expect(facts).toContain("acme/widgets");
    expect(facts).toContain("Next.js");
    expect(facts).toContain("Tailwind CSS");
    expect(facts).toContain("UI Components");
    expect(facts).toContain("[src/components/Button.tsx:5-45]");
    expect(facts).toContain("/api/auth");
  });

  it("constructs grounded user prompt with system instructions", () => {
    const facts = serializeModelToFacts(mockModel);
    const prompt = constructGroundedUserPrompt("Where is the Button?", facts);

    expect(prompt).toContain("VERIFIED REPOSITORY FACTS");
    expect(prompt).toContain("Where is the Button?");
    expect(prompt).toContain("[filePath:startLine-endLine]");
  });

  it("handles all 4 preset queries with deterministic grounded responses citing exact files", () => {
    for (const preset of PRESET_PROMPTS) {
      const response = generateDeterministicGroundedResponse(
        preset.query,
        mockModel,
      );
      expect(response).toBeTruthy();
      expect(response.length).toBeGreaterThan(50);

      // Verify citations are included
      if (preset.id === "architecture") {
        expect(response).toContain("UI Components");
        expect(response).toContain("Server APIs");
      } else if (preset.id === "auth-data") {
        expect(response).toContain("src/app/api/auth/route.ts");
      } else if (preset.id === "design-system") {
        expect(response).toContain("Radix UI");
        expect(response).toContain("src/components/Button.tsx:5-45");
      } else if (preset.id === "onboarding") {
        expect(response).toContain("src/components/Button.tsx:5-45");
        expect(response).toContain("Developer Onboarding Guide");
      }
    }
  });
});

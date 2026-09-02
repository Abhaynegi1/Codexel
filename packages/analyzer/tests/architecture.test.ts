import { describe, it, expect } from "vitest";
import { classifyArchitecture } from "../src/architecture/index";
import type { FileMetadata, DependencyGraph } from "@codexel/shared";

describe("Architecture & Layer Classifier", () => {
  const mockFiles: FileMetadata[] = [
    {
      path: "src/components/ui/button.tsx",
      extension: ".tsx",
      sizeBytes: 1200,
      linesOfCode: 45,
      isSource: true,
      isConfig: false,
    },
    {
      path: "src/components/ui/dialog.tsx",
      extension: ".tsx",
      sizeBytes: 2500,
      linesOfCode: 80,
      isSource: true,
      isConfig: false,
    },
    {
      path: "src/app/api/auth/[...nextauth]/route.ts",
      extension: ".ts",
      sizeBytes: 800,
      linesOfCode: 30,
      isSource: true,
      isConfig: false,
    },
    {
      path: "src/database/schema.ts",
      extension: ".ts",
      sizeBytes: 3000,
      linesOfCode: 110,
      isSource: true,
      isConfig: false,
    },
    {
      path: "src/features/dashboard/overview.tsx",
      extension: ".tsx",
      sizeBytes: 4000,
      linesOfCode: 150,
      isSource: true,
      isConfig: false,
    },
    {
      path: "src/lib/utils.ts",
      extension: ".ts",
      sizeBytes: 600,
      linesOfCode: 25,
      isSource: true,
      isConfig: false,
    },
    {
      path: "README.md",
      extension: ".md",
      sizeBytes: 500,
      linesOfCode: 20,
      isSource: false,
      isConfig: false,
    },
  ];

  const mockDepGraph: DependencyGraph = {
    nodes: [
      {
        id: "src/features/dashboard/overview.tsx",
        label: "overview.tsx",
        type: "file",
        data: {},
      },
      {
        id: "src/components/ui/button.tsx",
        label: "button.tsx",
        type: "file",
        data: {},
      },
      {
        id: "src/components/ui/dialog.tsx",
        label: "dialog.tsx",
        type: "file",
        data: {},
      },
      {
        id: "src/database/schema.ts",
        label: "schema.ts",
        type: "file",
        data: {},
      },
      {
        id: "src/lib/utils.ts",
        label: "utils.ts",
        type: "file",
        data: {},
      },
    ],
    edges: [
      // Features -> UI (allowed)
      {
        id: "edge:1",
        source: "src/features/dashboard/overview.tsx",
        target: "src/components/ui/button.tsx",
        type: "imports",
      },
      // Features -> Lib (allowed)
      {
        id: "edge:2",
        source: "src/features/dashboard/overview.tsx",
        target: "src/lib/utils.ts",
        type: "imports",
      },
      // UI -> Database (convention violation: UI should not directly query DB)
      {
        id: "edge:3",
        source: "src/components/ui/button.tsx",
        target: "src/database/schema.ts",
        type: "imports",
      },
    ],
  };

  it("classifies files into recognized architectural layers", async () => {
    const summary = await classifyArchitecture({
      workspacePath: "/dummy/workspace",
      files: mockFiles,
      dependencyGraph: mockDepGraph,
    });

    expect(summary.layers.length).toBeGreaterThanOrEqual(4);

    const roles = summary.layers.map((l) => l.role);
    expect(roles).toContain("ui");
    expect(roles).toContain("server");
    expect(roles).toContain("infrastructure");
    expect(roles).toContain("features");
    expect(roles).toContain("shared-utils");

    const uiLayer = summary.layers.find((l) => l.role === "ui");
    expect(uiLayer?.fileCount).toBe(2);
    expect(uiLayer?.isConfirmedFact).toBe(true);
    expect(uiLayer?.confidenceScore).toBeGreaterThan(0.8);
  });

  it("computes module boundaries and evaluates architecture conventions", async () => {
    const summary = await classifyArchitecture({
      workspacePath: "/dummy/workspace",
      files: mockFiles,
      dependencyGraph: mockDepGraph,
    });

    expect(summary.boundaries.length).toBeGreaterThan(0);

    // Check Features -> UI boundary
    const featuresToUi = summary.boundaries.find(
      (b) =>
        b.sourceLayerId === "layer:features" && b.targetLayerId === "layer:ui",
    );
    expect(featuresToUi).toBeDefined();
    expect(featuresToUi?.isAllowedByConvention).toBe(true);
    expect(featuresToUi?.importCount).toBe(1);

    // Check UI -> Infrastructure boundary (convention violation)
    const uiToInfra = summary.boundaries.find(
      (b) =>
        b.sourceLayerId === "layer:ui" &&
        b.targetLayerId === "layer:infrastructure",
    );
    expect(uiToInfra).toBeDefined();
    expect(uiToInfra?.isAllowedByConvention).toBe(false);
  });

  it("handles empty or root-only workspaces safely", async () => {
    const summary = await classifyArchitecture({
      workspacePath: "/empty",
      files: [],
    });

    expect(summary.layers.length).toBe(1);
    expect(summary.layers[0].role).toBe("unknown");
    expect(summary.boundaries).toEqual([]);
  });
});

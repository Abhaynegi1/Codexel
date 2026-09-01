import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  parseSourceFileAst,
  createAliasResolver,
  buildDependencyGraph,
  parseAstAndDependencies,
} from "../src/parsers/index";
import { scanFileSystem } from "../src/scanner/index";
import { DependencyGraphSchema } from "@codexel/shared";

describe("AST Parser & Module Dependency Graph", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codexel-ast-test-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignored
    }
  });

  it("extracts named, default, dynamic, and re-export imports from TypeScript source", () => {
    const code = `
      import React, { useState, useEffect } from "react";
      import { Button } from "@/components/Button";
      import type { User } from "./types";
      export * from "./utils";
      const dynamicModule = import("./lazy-component");
      const cjs = require("node:path");
      export const a = 1;
      export default function Main() { return null; }
    `;

    const summary = parseSourceFileAst("src/index.tsx", code);
    expect(summary.imports).toHaveLength(6);

    const reactImp = summary.imports.find((i) => i.specifier === "react");
    expect(reactImp?.importedNames).toContain("React");
    expect(reactImp?.importedNames).toContain("useState");

    const btnImp = summary.imports.find((i) => i.specifier === "@/components/Button");
    expect(btnImp?.importedNames).toContain("Button");

    const dynImp = summary.imports.find((i) => i.specifier === "./lazy-component");
    expect(dynImp?.isDynamic).toBe(true);

    const cjsImp = summary.imports.find((i) => i.specifier === "node:path");
    expect(cjsImp).toBeDefined();

    expect(summary.exports.some((e) => e.name === "a")).toBe(true);
    expect(summary.exports.some((e) => e.isDefault)).toBe(true);
  });

  it("resolves tsconfig path aliases and builds a validated module dependency DAG", async () => {
    // Setup tsconfig with `@/*` mapping to `src/*`
    await fs.writeFile(
      path.join(tempDir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      }),
    );

    await fs.mkdir(path.join(tempDir, "src", "components"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "src", "utils"), { recursive: true });

    await fs.writeFile(
      path.join(tempDir, "src", "utils", "format.ts"),
      "export function format(s: string) { return s.trim(); }",
    );

    await fs.writeFile(
      path.join(tempDir, "src", "components", "Button.tsx"),
      `import { format } from "@/utils/format";
       import React from "react";
       export function Button() { return <button>{format("Click")}</button>; }`,
    );

    await fs.writeFile(
      path.join(tempDir, "src", "index.ts"),
      `import { Button } from "@/components/Button";
       export const app = Button;`,
    );

    const graph = await parseAstAndDependencies(tempDir);

    // Validate graph against Zod schema
    expect(() => DependencyGraphSchema.parse(graph)).not.toThrow();

    // Check node existence
    const nodeIds = graph.nodes.map((n) => n.id);
    expect(nodeIds).toContain("src/index.ts");
    expect(nodeIds).toContain("src/components/Button.tsx");
    expect(nodeIds).toContain("src/utils/format.ts");
    expect(nodeIds).toContain("package:react");

    // Check edge connections
    const edges = graph.edges;
    expect(
      edges.some(
        (e) => e.source === "src/index.ts" && e.target === "src/components/Button.tsx",
      ),
    ).toBe(true);

    expect(
      edges.some(
        (e) =>
          e.source === "src/components/Button.tsx" &&
          e.target === "src/utils/format.ts",
      ),
    ).toBe(true);

    expect(
      edges.some(
        (e) =>
          e.source === "src/components/Button.tsx" &&
          e.target === "package:react",
      ),
    ).toBe(true);

    // Verify degrees
    const formatNode = graph.nodes.find((n) => n.id === "src/utils/format.ts");
    expect(formatNode?.data.inDegree).toBeGreaterThanOrEqual(1);

    const indexNode = graph.nodes.find((n) => n.id === "src/index.ts");
    expect(indexNode?.data.outDegree).toBeGreaterThanOrEqual(1);
  });
});

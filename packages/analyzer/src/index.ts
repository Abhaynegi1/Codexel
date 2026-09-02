import type { RepositoryModel } from "@codexel/shared";
import { CURRENT_SCHEMA_VERSION, ANALYZER_ENGINE_VERSION } from "./model/index";
import { scanFileSystem } from "./scanner/index";
import { detectTechnologies } from "./detectors/index";
import {
  parseAllSourceFiles,
  createAliasResolver,
  buildDependencyGraph,
  parseAstAndDependencies,
} from "./parsers/index";
import { classifyArchitecture } from "./architecture/index";
import { extractComponentInventory } from "./components/index";
import { extractDesignSystem } from "./design/index";
import { detectRoutes } from "./routes/index";

export * from "./scanner/index";
export * from "./detectors/index";
export * from "./parsers/index";
export * from "./components/index";
export * from "./routes/index";
export * from "./architecture/index";
export * from "./design/index";
export * from "./model/index";
export * from "./ingestion/index";

export interface AnalyzeRepositoryOptions {
  workspacePath: string;
  url: string;
  owner: string;
  name: string;
  commitSha: string;
  defaultBranch?: string;
  isPrivate?: boolean;
}

export async function analyzeRepository(
  options: AnalyzeRepositoryOptions,
): Promise<RepositoryModel> {
  const startTime = Date.now();

  // 1. Filesystem Scan & Technology Detection
  const scanStart = Date.now();
  const fileSystem = await scanFileSystem({
    workspacePath: options.workspacePath,
  });
  const technologyStack = await detectTechnologies(
    options.workspacePath,
    fileSystem.files,
  );
  const scanningMs = Date.now() - scanStart;

  // 2. AST Parsing & Dependency Graph
  const astStart = Date.now();
  const resolver = await createAliasResolver(
    options.workspacePath,
    fileSystem.files,
  );
  const astSummaries = await parseAllSourceFiles(
    options.workspacePath,
    fileSystem.files,
  );
  const astParsingMs = Date.now() - astStart;

  const graphStart = Date.now();
  const dependencyGraph = buildDependencyGraph(
    fileSystem.files,
    astSummaries,
    resolver,
  );
  const graphBuildingMs = Date.now() - graphStart;

  // 3. Component & Route Discovery
  const components = await extractComponentInventory(
    options.workspacePath,
    fileSystem.files,
    astSummaries,
    resolver,
  );
  const routes = detectRoutes(fileSystem.files, astSummaries);

  // 4. Architecture & Design System
  const architecture = await classifyArchitecture({
    workspacePath: options.workspacePath,
    files: fileSystem.files,
    dependencyGraph,
    routes,
    components,
  });
  const designSystem = await extractDesignSystem(options.workspacePath);

  const totalDurationMs = Date.now() - startTime;

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    metadata: {
      url: options.url,
      owner: options.owner,
      name: options.name,
      defaultBranch: options.defaultBranch || "main",
      commitSha: options.commitSha,
      isPrivate: options.isPrivate || false,
      analyzedAt: new Date().toISOString(),
    },
    technologyStack,
    fileSystem,
    architecture,
    components,
    dependencyGraph,
    routes,
    designSystem,
    analysisStats: {
      engineVersion: ANALYZER_ENGINE_VERSION,
      totalDurationMs,
      timings: {
        cloningMs: 0,
        scanningMs,
        astParsingMs,
        graphBuildingMs,
        designExtractionMs: 0,
      },
      peakMemoryMb: 0,
    },
  };
}

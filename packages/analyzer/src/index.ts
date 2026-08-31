import type { RepositoryModel } from "@codexel/shared";
import { CURRENT_SCHEMA_VERSION, ANALYZER_ENGINE_VERSION } from "./model/index";
import { scanFileSystem } from "./scanner/index";
import { detectTechnologies } from "./detectors/index";
import { parseAstAndDependencies } from "./parsers/index";
import { classifyArchitecture } from "./architecture/index";
import { extractComponentInventory } from "./components/index";
import { extractDesignSystem } from "./design/index";

export * from "./scanner/index";
export * from "./detectors/index";
export * from "./parsers/index";
export * from "./architecture/index";
export * from "./components/index";
export * from "./design/index";
export * from "./model/index";

export interface AnalyzeRepositoryOptions {
  workspacePath: string;
  url: string;
  owner: string;
  name: string;
  commitSha: string;
  defaultBranch?: string;
  isPrivate?: boolean;
}

export async function analyzeRepository(options: AnalyzeRepositoryOptions): Promise<RepositoryModel> {
  const startTime = Date.now();

  const fileSystem = await scanFileSystem({ workspacePath: options.workspacePath });
  const technologyStack = await detectTechnologies(options.workspacePath);
  const dependencyGraph = await parseAstAndDependencies(options.workspacePath);
  const architecture = await classifyArchitecture(options.workspacePath);
  const components = await extractComponentInventory(options.workspacePath);
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
    routes: {
      routerType: "unknown",
      routes: [],
    },
    designSystem,
    analysisStats: {
      engineVersion: ANALYZER_ENGINE_VERSION,
      totalDurationMs,
      timings: {
        cloningMs: 0,
        scanningMs: 0,
        astParsingMs: 0,
        graphBuildingMs: 0,
        designExtractionMs: 0,
      },
      peakMemoryMb: 0,
    },
  };
}

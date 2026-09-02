import type { TechnologyStack, FileMetadata } from "@codexel/shared";
import { TechnologyStackSchema } from "@codexel/shared";
import { parseWorkspaceManifests } from "./manifest-parser";
import { calculateLanguageStats } from "./languages";
import { evaluateTechnologyRules } from "./rules";
import { scanFileSystem } from "../scanner/index";

export * from "./manifest-parser";
export * from "./languages";
export * from "./rules";

/**
 * Deterministically detects the technologies, frameworks, and language distributions
 * across the scanned repository.
 */
export async function detectTechnologies(
  workspacePath: string,
  scannedFiles?: FileMetadata[],
): Promise<TechnologyStack> {
  // If files were not provided by caller, run scanner to obtain file list
  const files = scannedFiles ?? (await scanFileSystem({ workspacePath })).files;

  // 1. Parse all workspace package.json manifests
  const manifests = await parseWorkspaceManifests(workspacePath, files);

  // 2. Evaluate deterministic rules against manifests and files
  const categorizedTags = evaluateTechnologyRules(manifests, files);

  // 3. Compute programming language stats and primary language
  const languageStats = calculateLanguageStats(files);

  const stack: TechnologyStack = {
    primaryLanguage: languageStats.primaryLanguage,
    languages: languageStats.languages,
    frameworks: categorizedTags.frameworks,
    styling: categorizedTags.styling,
    database: categorizedTags.database,
    stateManagement: categorizedTags.stateManagement,
    uiLibraries: categorizedTags.uiLibraries,
    buildTools: categorizedTags.buildTools,
  };

  // Validate output against Zod schema for structural guarantee
  return TechnologyStackSchema.parse(stack);
}

import type { TechnologyStack } from "@codexel/shared";

export async function detectTechnologies(workspacePath: string): Promise<TechnologyStack> {
  // Skeleton implementation for Phase 0 foundation
  return {
    primaryLanguage: "Unknown",
    languages: [],
    frameworks: [],
    styling: [],
    database: [],
    stateManagement: [],
    uiLibraries: [],
    buildTools: [],
  };
}

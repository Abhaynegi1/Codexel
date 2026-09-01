import type { DesignSystemSummary } from "@codexel/shared";

export async function extractDesignSystem(
  workspacePath: string,
): Promise<DesignSystemSummary> {
  // Skeleton implementation for Phase 0 foundation
  return {
    colorPalette: [],
    typography: {
      fontFamilies: [],
      fontSizes: [],
      fontWeights: [],
    },
    spacing: [],
    borderRadii: [],
    detectedCssVariables: {},
    topTailwindClasses: [],
    libraries: {},
  };
}

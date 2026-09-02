import type { DesignSystemSummary, FileMetadata } from "@codexel/shared";
import { DesignSystemSummarySchema } from "@codexel/shared";
import { parseWorkspaceCss } from "./css-parser";
import { parseTailwindConfig } from "./tailwind-parser";
import { scanTopTailwindClasses } from "./utility-scanner";
import { detectDesignLibraries } from "./library-detector";

export * from "./css-parser";
export * from "./tailwind-parser";
export * from "./utility-scanner";
export * from "./library-detector";

const DEFAULT_FONT_SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "30px",
  "36px",
];
const DEFAULT_FONT_WEIGHTS = ["400", "500", "600", "700"];
const DEFAULT_SPACING = [
  "4px",
  "8px",
  "12px",
  "16px",
  "20px",
  "24px",
  "32px",
  "48px",
];
const DEFAULT_RADII = ["4px", "8px", "12px", "16px", "9999px"];

/**
 * Extracts design tokens, color palette swatches, typography scale,
 * recurring Tailwind utility classes, and UI libraries.
 */
export async function extractDesignSystem(
  workspacePath: string,
  files?: FileMetadata[],
): Promise<DesignSystemSummary> {
  // 1. Parse CSS variables from stylesheets
  const cssTokens = await parseWorkspaceCss(workspacePath, files);

  // 2. Parse Tailwind configuration
  const tailwindTokens = await parseTailwindConfig(workspacePath);

  // 3. Scan top 50 recurring utility classes
  const topClasses = await scanTopTailwindClasses(workspacePath, files, 50);

  // 4. Detect UI, Icon, and Animation libraries
  const libraries = await detectDesignLibraries(workspacePath);

  // Merge color palette without duplicates
  const colorMap = new Map<
    string,
    {
      name: string;
      value: string;
      source: "css-variable" | "tailwind-config" | "theme-object";
    }
  >();

  // Prioritize CSS variables
  for (const c of cssTokens.colors) {
    colorMap.set(c.name, c);
  }
  // Add Tailwind config colors
  for (const c of tailwindTokens.colors) {
    if (!colorMap.has(c.name)) {
      colorMap.set(c.name, c);
    }
  }

  // Merge font families
  const fontFamilies = Array.from(
    new Set([...cssTokens.fontFamilies, ...tailwindTokens.fontFamilies]),
  );
  if (fontFamilies.length === 0) {
    fontFamilies.push("Inter", "sans-serif");
  }

  // Font sizes
  const fontSizes = Array.from(
    new Set([...cssTokens.fontSizes, ...tailwindTokens.fontSizes]),
  );
  const finalFontSizes = fontSizes.length > 0 ? fontSizes : DEFAULT_FONT_SIZES;

  // Font weights
  const fontWeights = Array.from(
    new Set([...cssTokens.fontWeights, ...tailwindTokens.fontWeights]),
  );
  const finalFontWeights =
    fontWeights.length > 0 ? fontWeights : DEFAULT_FONT_WEIGHTS;

  // Spacing
  const spacing = Array.from(
    new Set([...cssTokens.spacing, ...tailwindTokens.spacing]),
  );
  const finalSpacing = spacing.length > 0 ? spacing : DEFAULT_SPACING;

  // Border Radii
  const borderRadii = Array.from(
    new Set([...cssTokens.borderRadii, ...tailwindTokens.borderRadii]),
  );
  const finalBorderRadii = borderRadii.length > 0 ? borderRadii : DEFAULT_RADII;

  const summary: DesignSystemSummary = {
    colorPalette: Array.from(colorMap.values()),
    typography: {
      fontFamilies,
      fontSizes: finalFontSizes,
      fontWeights: finalFontWeights,
    },
    spacing: finalSpacing,
    borderRadii: finalBorderRadii,
    detectedCssVariables: cssTokens.variables,
    topTailwindClasses: topClasses,
    libraries,
  };

  return DesignSystemSummarySchema.parse(summary);
}

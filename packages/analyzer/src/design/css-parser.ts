import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { DesignTokenColor, FileMetadata } from "@codexel/shared";

export interface ParsedCssTokens {
  colors: DesignTokenColor[];
  fontFamilies: string[];
  fontSizes: string[];
  fontWeights: string[];
  spacing: string[];
  borderRadii: string[];
  variables: Record<string, string>;
}

/**
 * Normalizes CSS color values like:
 * - "222.2 84% 4.9%" -> "hsl(222.2, 84%, 4.9%)"
 * - "0 0% 100%" -> "hsl(0, 0%, 100%)"
 * - "#ffffff", "rgb(...)", "hsl(...)" -> preserved
 */
export function normalizeCssColor(raw: string): string {
  const trimmed = raw.trim().replace(/;$/, "");

  // If it's already a valid hex, rgb, rgba, hsl, hsla, or named color
  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("rgb(") ||
    trimmed.startsWith("rgba(") ||
    trimmed.startsWith("hsl(") ||
    trimmed.startsWith("hsla(")
  ) {
    return trimmed;
  }

  // Check for Tailwind/shadcn raw HSL channel format e.g. "222.2 84% 4.9%" or "0 0% 100%"
  const hslTupleMatch = trimmed.match(
    /^([\d.]+)\s+([\d.]+%)\s+([\d.]+%)(?:\s*\/\s*([\d.]+%?))?$/,
  );
  if (hslTupleMatch) {
    const [, h, s, l, alpha] = hslTupleMatch;
    if (alpha) {
      return `hsla(${h}, ${s}, ${l}, ${alpha})`;
    }
    return `hsl(${h}, ${s}, ${l})`;
  }

  return trimmed;
}

/**
 * Parses CSS stylesheet contents to extract custom properties and classified design tokens.
 */
export function parseCssVariablesFromContent(
  cssContent: string,
): ParsedCssTokens {
  const variables: Record<string, string> = {};
  const colors: DesignTokenColor[] = [];
  const fontFamilies = new Set<string>();
  const fontSizes = new Set<string>();
  const fontWeights = new Set<string>();
  const spacing = new Set<string>();
  const borderRadii = new Set<string>();

  // Matches variable definitions like: --foo-bar: #fff;
  const varRegex = /(--[\w-]+)\s*:\s*([^;{}]+);/g;
  let match: RegExpExecArray | null;

  while ((match = varRegex.exec(cssContent)) !== null) {
    const varName = match[1]?.trim() || "";
    const rawVal = match[2]?.trim() || "";

    if (!variables[varName]) {
      variables[varName] = rawVal;
    }

    const lowerName = varName.toLowerCase();
    const lowerVal = rawVal.toLowerCase();

    // 1. Check for Color tokens
    const isColorName =
      lowerName.includes("color") ||
      lowerName.includes("bg") ||
      lowerName.includes("background") ||
      lowerName.includes("foreground") ||
      lowerName.includes("primary") ||
      lowerName.includes("secondary") ||
      lowerName.includes("accent") ||
      lowerName.includes("muted") ||
      lowerName.includes("destructive") ||
      lowerName.includes("border") ||
      lowerName.includes("ring") ||
      lowerName.includes("input") ||
      lowerName.includes("card") ||
      lowerName.includes("popover");

    const looksLikeColorVal =
      rawVal.startsWith("#") ||
      rawVal.startsWith("rgb") ||
      rawVal.startsWith("hsl") ||
      /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%/.test(rawVal);

    if (isColorName || looksLikeColorVal) {
      const normalized = normalizeCssColor(rawVal);
      const cleanColorName = varName.replace(/^--/, "");
      // Avoid duplicate color names (prefer :root definition)
      if (!colors.some((c) => c.name === cleanColorName)) {
        colors.push({
          name: cleanColorName,
          value: normalized,
          source: "css-variable",
        });
      }
      continue;
    }

    // 2. Check for Font tokens
    if (lowerName.includes("font") || lowerName.includes("family")) {
      fontFamilies.add(rawVal.replace(/['"]/g, ""));
    } else if (lowerName.includes("radius")) {
      borderRadii.add(rawVal);
    } else if (lowerName.includes("spacing") || lowerName.includes("gap")) {
      spacing.add(rawVal);
    }
  }

  return {
    colors,
    fontFamilies: Array.from(fontFamilies),
    fontSizes: Array.from(fontSizes),
    fontWeights: Array.from(fontWeights),
    spacing: Array.from(spacing),
    borderRadii: Array.from(borderRadii),
    variables,
  };
}

/**
 * Discovers and parses all CSS files in a workspace.
 */
export async function parseWorkspaceCss(
  workspacePath: string,
  files?: FileMetadata[],
): Promise<ParsedCssTokens> {
  const result: ParsedCssTokens = {
    colors: [],
    fontFamilies: [],
    fontSizes: [],
    fontWeights: [],
    spacing: [],
    borderRadii: [],
    variables: {},
  };

  const cssPaths: string[] = [];

  if (files) {
    for (const file of files) {
      if (file.extension === ".css" || file.extension === ".scss") {
        cssPaths.push(file.path);
      }
    }
  } else {
    // Fallback: check typical stylesheet locations
    const candidates = [
      "src/app/globals.css",
      "src/globals.css",
      "src/index.css",
      "src/styles/globals.css",
      "src/styles/index.css",
      "app/globals.css",
      "styles/globals.css",
    ];

    for (const rel of candidates) {
      const full = path.join(workspacePath, rel);
      try {
        await fs.access(full);
        cssPaths.push(rel);
      } catch {
        // Not found
      }
    }
  }

  for (const relPath of cssPaths) {
    const fullPath = path.isAbsolute(relPath)
      ? relPath
      : path.join(workspacePath, relPath);
    try {
      const content = await fs.readFile(fullPath, "utf-8");
      const parsed = parseCssVariablesFromContent(content);

      // Merge variables
      Object.assign(result.variables, parsed.variables);

      // Merge colors without duplicates
      for (const color of parsed.colors) {
        if (!result.colors.some((c) => c.name === color.name)) {
          result.colors.push(color);
        }
      }

      // Merge sets
      for (const f of parsed.fontFamilies) {
        if (!result.fontFamilies.includes(f)) result.fontFamilies.push(f);
      }
      for (const r of parsed.borderRadii) {
        if (!result.borderRadii.includes(r)) result.borderRadii.push(r);
      }
      for (const s of parsed.spacing) {
        if (!result.spacing.includes(s)) result.spacing.push(s);
      }
    } catch {
      // Ignore unreadable CSS file
    }
  }

  return result;
}

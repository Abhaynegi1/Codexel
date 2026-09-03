import * as fs from "node:fs/promises";
import * as path from "node:path";
import ts from "typescript";
import type { DesignTokenColor, FileMetadata } from "@codexel/shared";

export interface ParsedTailwindConfig {
  hasConfig: boolean;
  configPath?: string;
  colors: DesignTokenColor[];
  fontFamilies: string[];
  fontSizes: string[];
  fontWeights: string[];
  spacing: string[];
  borderRadii: string[];
}

const TAILWIND_CONFIG_NAMES = [
  "tailwind.config.ts",
  "tailwind.config.js",
  "tailwind.config.mjs",
  "tailwind.config.cjs",
];

/**
 * Recursively parses object literal nodes in TypeScript AST to extract string and nested values.
 */
function extractObjectProperties(
  objNode: ts.ObjectLiteralExpression,
  sourceFile: ts.SourceFile,
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const prop of objNode.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const propName = prop.name.getText(sourceFile).replace(/['"]/g, "");
      const init = prop.initializer;

      if (
        ts.isStringLiteral(init) ||
        ts.isNoSubstitutionTemplateLiteral(init)
      ) {
        result[propName] = init.text;
      } else if (ts.isObjectLiteralExpression(init)) {
        result[propName] = extractObjectProperties(init, sourceFile);
      } else if (ts.isArrayLiteralExpression(init)) {
        result[propName] = init.elements
          .filter(
            (el) =>
              ts.isStringLiteral(el) || ts.isNoSubstitutionTemplateLiteral(el),
          )
          .map((el) => (el as ts.StringLiteral).text);
      } else {
        result[propName] = init.getText(sourceFile);
      }
    }
  }

  return result;
}

/**
 * Statically inspects a Tailwind configuration file using TypeScript AST.
 */
export async function parseTailwindConfig(
  workspacePath: string,
  files?: FileMetadata[],
): Promise<ParsedTailwindConfig> {
  let foundConfigPath: string | null = null;

  // 1. Try finding root config first
  for (const configName of TAILWIND_CONFIG_NAMES) {
    const candidate = path.join(workspacePath, configName);
    try {
      await fs.access(candidate);
      foundConfigPath = candidate;
      break;
    } catch {
      // Continue
    }
  }

  // 2. If not found at root, check files metadata for nested config
  if (!foundConfigPath && files && files.length > 0) {
    for (const f of files) {
      const base = path.basename(f.path);
      if (TAILWIND_CONFIG_NAMES.includes(base)) {
        foundConfigPath = path.isAbsolute(f.path)
          ? f.path
          : path.join(workspacePath, f.path);
        break;
      }
    }
  }

  // 3. Fallback: check typical nested app/package directories
  if (!foundConfigPath) {
    const nestedCandidates = [
      "apps/web/tailwind.config.ts",
      "apps/web/tailwind.config.js",
      "apps/frontend/tailwind.config.ts",
      "apps/frontend/tailwind.config.js",
      "packages/ui/tailwind.config.ts",
      "packages/ui/tailwind.config.js",
      "frontend/tailwind.config.ts",
      "frontend/tailwind.config.js",
      "client/tailwind.config.ts",
      "client/tailwind.config.js",
      "src/tailwind.config.ts",
      "src/tailwind.config.js",
    ];
    for (const rel of nestedCandidates) {
      const candidate = path.join(workspacePath, rel);
      try {
        await fs.access(candidate);
        foundConfigPath = candidate;
        break;
      } catch {
        // Continue
      }
    }
  }

  if (!foundConfigPath) {
    return {
      hasConfig: false,
      colors: [],
      fontFamilies: [],
      fontSizes: [],
      fontWeights: [],
      spacing: [],
      borderRadii: [],
    };
  }

  try {
    const code = await fs.readFile(foundConfigPath, "utf-8");
    const sourceFile = ts.createSourceFile(
      foundConfigPath,
      code,
      ts.ScriptTarget.Latest,
      true,
    );

    let themeNode: ts.ObjectLiteralExpression | null = null;

    function visit(node: ts.Node) {
      if (
        ts.isPropertyAssignment(node) &&
        node.name.getText(sourceFile).replace(/['"]/g, "") === "theme" &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        themeNode = node.initializer;
        return;
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    const colors: DesignTokenColor[] = [];
    const fontFamilies: string[] = [];
    const fontSizes: string[] = [];
    const fontWeights: string[] = [];
    const spacing: string[] = [];
    const borderRadii: string[] = [];

    if (themeNode) {
      const themeObj = extractObjectProperties(themeNode, sourceFile);
      const extendObj = themeObj.extend || {};

      // 1. Colors from theme or theme.extend
      const colorsObj = {
        ...(themeObj.colors || {}),
        ...(extendObj.colors || {}),
      };
      for (const [key, val] of Object.entries(colorsObj)) {
        if (typeof val === "string") {
          colors.push({
            name: key,
            value: val,
            source: "tailwind-config",
          });
        } else if (typeof val === "object" && val !== null) {
          for (const [subKey, subVal] of Object.entries(val)) {
            if (typeof subVal === "string") {
              const name = subKey === "DEFAULT" ? key : `${key}-${subKey}`;
              colors.push({
                name,
                value: subVal,
                source: "tailwind-config",
              });
            }
          }
        }
      }

      // 2. Font Families
      const fontObj = {
        ...(themeObj.fontFamily || {}),
        ...(extendObj.fontFamily || {}),
      };
      for (const [, val] of Object.entries(fontObj)) {
        if (Array.isArray(val)) {
          for (const f of val) {
            if (typeof f === "string" && !fontFamilies.includes(f)) {
              fontFamilies.push(f);
            }
          }
        } else if (typeof val === "string" && !fontFamilies.includes(val)) {
          fontFamilies.push(val);
        }
      }

      // 3. Border Radii
      const radiiObj = {
        ...(themeObj.borderRadius || {}),
        ...(extendObj.borderRadius || {}),
      };
      for (const [, val] of Object.entries(radiiObj)) {
        if (typeof val === "string" && !borderRadii.includes(val)) {
          borderRadii.push(val);
        }
      }

      // 4. Spacing
      const spacingObj = {
        ...(themeObj.spacing || {}),
        ...(extendObj.spacing || {}),
      };
      for (const [, val] of Object.entries(spacingObj)) {
        if (typeof val === "string" && !spacing.includes(val)) {
          spacing.push(val);
        }
      }
    }

    return {
      hasConfig: true,
      configPath: path.basename(foundConfigPath),
      colors,
      fontFamilies,
      fontSizes,
      fontWeights,
      spacing,
      borderRadii,
    };
  } catch (err) {
    return {
      hasConfig: true,
      configPath: path.basename(foundConfigPath),
      colors: [],
      fontFamilies: [],
      fontSizes: [],
      fontWeights: [],
      spacing: [],
      borderRadii: [],
    };
  }
}

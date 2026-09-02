import fs from "node:fs/promises";
import path from "node:path";
import type { FileMetadata } from "@codexel/shared";
import { normalizeRelativePath } from "../scanner/ignore-engine";

export interface PathAliasRule {
  prefix: string; // e.g. "@/" or "~/"
  targets: string[]; // e.g. ["src/*"]
  configDir: string; // Relative directory where tsconfig was found
}

export interface AliasResolver {
  resolve(
    specifier: string,
    sourceFilePath: string,
  ): {
    resolvedPath?: string; // Relative POSIX path if local file
    isExternal: boolean;
    packageName?: string;
  };
}

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"];

/**
 * Creates an alias and module path resolver given workspace files and tsconfig path aliases.
 */
export async function createAliasResolver(
  workspacePath: string,
  knownFiles: FileMetadata[],
): Promise<AliasResolver> {
  const fileSet = new Set(knownFiles.map((f) => normalizeRelativePath(f.path)));
  const rules: PathAliasRule[] = [];

  // Search for tsconfig.json and jsconfig.json files
  const configFiles = knownFiles.filter((f) => {
    const base = path.basename(f.path).toLowerCase();
    return base === "tsconfig.json" || base === "jsconfig.json";
  });

  for (const configFile of configFiles) {
    try {
      const fullPath = path.join(workspacePath, configFile.path);
      const content = await fs.readFile(fullPath, "utf-8");
      // Strip comments from json if any
      const cleaned = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
      const json = JSON.parse(cleaned);
      const compilerOptions = json.compilerOptions;
      if (compilerOptions && compilerOptions.paths) {
        const configDir = path.dirname(configFile.path);
        for (const [aliasPattern, targetPatterns] of Object.entries(
          compilerOptions.paths,
        )) {
          if (Array.isArray(targetPatterns)) {
            const prefix = aliasPattern.replace(/\*$/, "");
            const targets = targetPatterns.map((t: any) =>
              String(t).replace(/\*$/, ""),
            );
            rules.push({ prefix, targets, configDir });
          }
        }
      }
    } catch {
      // Non-fatal if tsconfig has unusual formatting
    }
  }

  // Fallback rule for standard `@/*` -> `src/*` if no rule loaded
  if (rules.length === 0) {
    rules.push({
      prefix: "@/",
      targets: ["src/", "./"],
      configDir: ".",
    });
  }

  function tryResolveWithExtensions(
    candidateRelPath: string,
  ): string | undefined {
    const normalized = normalizeRelativePath(candidateRelPath);

    // 1. Exact match
    if (fileSet.has(normalized)) {
      return normalized;
    }

    // 2. Append extensions
    for (const ext of EXTENSIONS) {
      const withExt = `${normalized}${ext}`;
      if (fileSet.has(withExt)) {
        return withExt;
      }
    }

    // 3. Directory index
    for (const ext of EXTENSIONS) {
      const indexWithExt = `${normalized}/index${ext}`;
      if (fileSet.has(indexWithExt)) {
        return indexWithExt;
      }
    }

    return undefined;
  }

  return {
    resolve(specifier: string, sourceFilePath: string) {
      // 1. Relative imports
      if (specifier.startsWith("./") || specifier.startsWith("../")) {
        const sourceDir = path.dirname(sourceFilePath);
        const resolvedCandidate = path.join(sourceDir, specifier);
        const found = tryResolveWithExtensions(resolvedCandidate);
        if (found) {
          return { resolvedPath: found, isExternal: false };
        }
        return {
          resolvedPath: normalizeRelativePath(resolvedCandidate),
          isExternal: false,
        };
      }

      // 2. Path Aliases (e.g. `@/components/Button`)
      for (const rule of rules) {
        if (specifier.startsWith(rule.prefix)) {
          const remainder = specifier.slice(rule.prefix.length);
          for (const target of rule.targets) {
            const candidate = path.join(
              rule.configDir === "." ? "" : rule.configDir,
              target,
              remainder,
            );
            const found = tryResolveWithExtensions(candidate);
            if (found) {
              return { resolvedPath: found, isExternal: false };
            }
          }
        }
      }

      // 3. External package imports (e.g., `react`, `@radix-ui/react-dialog`)
      // Extracts base package name (including scope if any)
      const parts = specifier.split("/");
      const packageName =
        specifier.startsWith("@") && parts.length >= 2
          ? `${parts[0]}/${parts[1]}`
          : parts[0];

      return {
        isExternal: true,
        packageName,
      };
    },
  };
}

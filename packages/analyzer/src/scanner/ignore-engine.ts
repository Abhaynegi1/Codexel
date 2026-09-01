import fs from "node:fs/promises";
import path from "node:path";
import ignore, { type Ignore } from "ignore";
import { DEFAULT_IGNORE_PATTERNS } from "@codexel/shared";

export const ALWAYS_IGNORED_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  ".cache",
  ".turbo",
  ".svn",
  ".hg",
]);

/**
 * Normalizes a relative path for ignore evaluation:
 * - Replaces backslashes with forward slashes
 * - Strips leading slashes or dots
 */
export function normalizeRelativePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\.?\//, "");
}

export interface IgnoreEngine {
  isIgnored(relativeFilePath: string, isDirectory?: boolean): boolean;
  isDirNameAlwaysIgnored(dirName: string): boolean;
}

/**
 * Creates an ignore engine combining default ignore patterns,
 * any .gitignore found in the workspace root, and user-provided custom patterns.
 */
export async function createIgnoreEngine(
  workspacePath: string,
  customIgnores: string[] = [],
): Promise<IgnoreEngine> {
  const ig: Ignore = ignore();

  // 1. Add standard defaults
  // The ignore library expects gitignore-formatted lines
  const defaultRules = [
    "node_modules",
    "node_modules/",
    ".git",
    ".git/",
    ".next",
    ".next/",
    "dist",
    "dist/",
    "build",
    "build/",
    "out",
    "out/",
    "coverage",
    "coverage/",
    ".cache",
    ".cache/",
    ".turbo",
    ".turbo/",
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    "pnpm-debug.log*",
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    "bun.lockb",
    ".DS_Store",
    "Thumbs.db",
  ];
  ig.add(defaultRules);

  // 2. Add patterns from DEFAULT_IGNORE_PATTERNS (stripping leading **/ if present)
  for (const pattern of DEFAULT_IGNORE_PATTERNS) {
    const cleanPattern = pattern.replace(/^\*\*\//, "");
    ig.add(cleanPattern);
  }

  // 3. Attempt to read .gitignore in workspace root
  try {
    const gitignorePath = path.join(workspacePath, ".gitignore");
    const content = await fs.readFile(gitignorePath, "utf-8");
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
    ig.add(lines);
  } catch {
    // .gitignore does not exist or cannot be read; non-fatal
  }

  // 4. Add custom user patterns
  if (customIgnores.length > 0) {
    ig.add(customIgnores);
  }

  return {
    isIgnored(relativeFilePath: string, isDirectory = false): boolean {
      const normalized = normalizeRelativePath(relativeFilePath);
      if (!normalized) return false;

      // Direct check against fast dir names
      const firstSegment = normalized.split("/")[0];
      if (firstSegment && ALWAYS_IGNORED_DIR_NAMES.has(firstSegment)) {
        return true;
      }

      const testPath = isDirectory && !normalized.endsWith("/") ? `${normalized}/` : normalized;
      try {
        return ig.ignores(testPath);
      } catch {
        return false;
      }
    },
    isDirNameAlwaysIgnored(dirName: string): boolean {
      return ALWAYS_IGNORED_DIR_NAMES.has(dirName);
    },
  };
}

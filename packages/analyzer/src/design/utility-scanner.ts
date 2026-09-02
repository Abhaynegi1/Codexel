import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { FileMetadata } from "@codexel/shared";

export interface UtilityClassCount {
  className: string;
  count: number;
}

// Regex to capture className or class string literals or template literals
const CLASSNAME_REGEX =
  /(?:className|class)\s*=\s*(?:["']([^"']+)["']|{`([^`]+)`}|{["']([^"']+)["']})/g;

// Regex to capture arguments inside cn(...) or clsx(...) or cva(...)
const CN_REGEX = /\b(?:cn|clsx|cva)\s*\(\s*([^()]+)\)/g;

/**
 * Normalizes and extracts individual class tokens from a raw string.
 */
function extractClassTokens(raw: string): string[] {
  // Strip JS template expressions e.g. ${...}
  const clean = raw.replace(/\$\{[^}]+\}/g, " ");

  return clean
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => {
      if (!s) return false;
      // Skip arbitrary code or quotes
      if (s.startsWith("{") || s.endsWith("}")) return false;
      if (s.startsWith("[") && !s.includes("]:")) return false;
      if (s === "true" || s === "false" || s === "null" || s === "undefined") return false;
      return true;
    });
}

/**
 * Scans source files in workspace and computes the frequency histogram of Tailwind utility classes.
 * Returns the top 50 most recurring classes.
 */
export async function scanTopTailwindClasses(
  workspacePath: string,
  files?: FileMetadata[],
  limit: number = 50,
): Promise<UtilityClassCount[]> {
  const counts = new Map<string, number>();

  // Determine candidate source files
  const candidateFiles: string[] = [];

  if (files) {
    for (const f of files) {
      if (
        f.extension === ".tsx" ||
        f.extension === ".jsx" ||
        f.extension === ".html" ||
        f.extension === ".vue" ||
        f.extension === ".svelte"
      ) {
        candidateFiles.push(f.path);
      }
    }
  }

  // If no files passed, check common app/src directories
  if (candidateFiles.length === 0) {
    async function walk(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (
            entry.name === "node_modules" ||
            entry.name === ".git" ||
            entry.name === ".next" ||
            entry.name === "dist"
          ) {
            continue;
          }

          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walk(full);
          } else if (
            entry.name.endsWith(".tsx") ||
            entry.name.endsWith(".jsx") ||
            entry.name.endsWith(".html")
          ) {
            candidateFiles.push(path.relative(workspacePath, full));
          }
        }
      } catch {
        // Ignore read errors
      }
    }

    await walk(workspacePath);
  }

  for (const relPath of candidateFiles) {
    const fullPath = path.isAbsolute(relPath)
      ? relPath
      : path.join(workspacePath, relPath);

    try {
      const content = await fs.readFile(fullPath, "utf-8");

      // 1. Match className="..." and class="..."
      let match: RegExpExecArray | null;
      while ((match = CLASSNAME_REGEX.exec(content)) !== null) {
        const rawStr = match[1] || match[2] || match[3] || "";
        const tokens = extractClassTokens(rawStr);
        for (const token of tokens) {
          counts.set(token, (counts.get(token) || 0) + 1);
        }
      }

      // 2. Match cn(...) calls
      while ((match = CN_REGEX.exec(content)) !== null) {
        const rawArgs = match[1] || "";
        // Extract string literals within the arguments
        const stringLitRegex = /["']([^"']+)["']/g;
        let litMatch: RegExpExecArray | null;
        while ((litMatch = stringLitRegex.exec(rawArgs)) !== null) {
          const tokens = extractClassTokens(litMatch[1] || "");
          for (const token of tokens) {
            counts.set(token, (counts.get(token) || 0) + 1);
          }
        }
      }
    } catch {
      // Ignore unreadable files
    }
  }

  // Sort descending by count and take top N
  return Array.from(counts.entries())
    .map(([className, count]) => ({ className, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

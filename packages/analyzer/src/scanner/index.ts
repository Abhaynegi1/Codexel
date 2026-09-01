import fs from "node:fs/promises";
import path from "node:path";
import type { FileSystemSummary, FileMetadata } from "@codexel/shared";
import { FileSystemSummarySchema } from "@codexel/shared";
import { createIgnoreEngine, normalizeRelativePath } from "./ignore-engine";
import { classifyFile } from "./file-classifier";
import { countLinesOfCode } from "./line-counter";

export * from "./ignore-engine";
export * from "./file-classifier";
export * from "./line-counter";

export interface ScanOptions {
  workspacePath: string;
  customIgnores?: string[];
  maxFiles?: number;
}

/**
 * Deterministically walks the workspace filesystem, applies ignore rules,
 * computes line counts, sizes, and file classifications.
 */
export async function scanFileSystem(
  options: ScanOptions,
): Promise<FileSystemSummary> {
  const { workspacePath, customIgnores } = options;
  const ignoreEngine = await createIgnoreEngine(workspacePath, customIgnores);

  const files: FileMetadata[] = [];
  const rootDirectories: string[] = [];
  let totalDirectories = 0;
  let totalLinesOfCode = 0;
  let ignoredCount = 0;

  async function walk(currentDir: string, isRoot = false): Promise<void> {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    // Sort entries deterministically by name
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = normalizeRelativePath(
        path.relative(workspacePath, fullPath),
      );

      if (entry.isDirectory()) {
        if (isRoot) {
          if (
            ignoreEngine.isDirNameAlwaysIgnored(entry.name) ||
            ignoreEngine.isIgnored(relativePath, true)
          ) {
            ignoredCount++;
            continue;
          }
          rootDirectories.push(entry.name);
        } else {
          if (
            ignoreEngine.isDirNameAlwaysIgnored(entry.name) ||
            ignoreEngine.isIgnored(relativePath, true)
          ) {
            ignoredCount++;
            continue;
          }
        }

        totalDirectories++;
        await walk(fullPath, false);
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        if (ignoreEngine.isIgnored(relativePath, false)) {
          ignoredCount++;
          continue;
        }

        try {
          const stat = await fs.stat(fullPath);
          const classification = classifyFile(relativePath);
          const lines = await countLinesOfCode(fullPath);

          files.push({
            path: relativePath,
            extension: classification.extension,
            sizeBytes: stat.size,
            linesOfCode: lines,
            isSource: classification.isSource,
            isConfig: classification.isConfig,
          });

          totalLinesOfCode += lines;
        } catch {
          // If stat or read fails, record file with zeroed stats
          const classification = classifyFile(relativePath);
          files.push({
            path: relativePath,
            extension: classification.extension,
            sizeBytes: 0,
            linesOfCode: 0,
            isSource: classification.isSource,
            isConfig: classification.isConfig,
          });
        }
      }
    }
  }

  await walk(workspacePath, true);

  // Sort files lexicographically by path
  files.sort((a, b) => a.path.localeCompare(b.path));
  rootDirectories.sort((a, b) => a.localeCompare(b));

  const summary: FileSystemSummary = {
    totalFiles: files.length,
    totalDirectories,
    totalLinesOfCode,
    rootDirectories,
    ignoredCount,
    files,
  };

  // Validate against Zod schema to ensure structural guarantee
  return FileSystemSummarySchema.parse(summary);
}

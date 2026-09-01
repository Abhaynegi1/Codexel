import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { IngestionLimits } from "@codexel/shared";
import { DEFAULT_INGESTION_LIMITS } from "@codexel/shared";
import { RepositoryLimitExceededError } from "./errors";

export interface BoundaryInspectionResult {
  fileCount: number;
  totalSizeBytes: number;
}

export interface BoundaryOptions {
  limits?: Partial<IngestionLimits>;
  excludeGitDir?: boolean;
}

/**
 * Validates that a directory respects safety boundaries (max files and max total bytes).
 * Short-circuits immediately if a limit is exceeded to prevent resource exhaustion.
 */
export async function verifySandboxBoundaries(
  directoryPath: string,
  options: BoundaryOptions = {},
): Promise<BoundaryInspectionResult> {
  const maxFiles =
    options.limits?.maxFiles ?? DEFAULT_INGESTION_LIMITS.maxFiles;
  const maxSizeBytes =
    options.limits?.maxSizeBytes ?? DEFAULT_INGESTION_LIMITS.maxSizeBytes;
  const excludeGitDir = options.excludeGitDir ?? false;

  let fileCount = 0;
  let totalSizeBytes = 0;

  async function walk(dir: string): Promise<void> {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err: any) {
      if (err.code === "ENOENT") return;
      throw err;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (excludeGitDir && entry.name === ".git") {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        fileCount += 1;

        if (fileCount > maxFiles) {
          throw new RepositoryLimitExceededError(
            "MAX_FILES",
            fileCount,
            maxFiles,
          );
        }

        try {
          const stats = await fs.stat(fullPath);
          totalSizeBytes += stats.size;
        } catch {
          // Ignore missing symlinks or dangling references
        }

        if (totalSizeBytes > maxSizeBytes) {
          throw new RepositoryLimitExceededError(
            "MAX_SIZE",
            totalSizeBytes,
            maxSizeBytes,
          );
        }
      }
    }
  }

  await walk(directoryPath);

  return {
    fileCount,
    totalSizeBytes,
  };
}

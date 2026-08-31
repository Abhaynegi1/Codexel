import type { FileSystemSummary, FileMetadata } from "@codexel/shared";
import { DEFAULT_IGNORE_PATTERNS } from "@codexel/shared";

export interface ScanOptions {
  workspacePath: string;
  customIgnores?: string[];
}

export async function scanFileSystem(options: ScanOptions): Promise<FileSystemSummary> {
  // Skeleton implementation for Phase 0 foundation
  return {
    totalFiles: 0,
    totalDirectories: 0,
    totalLinesOfCode: 0,
    rootDirectories: [],
    ignoredCount: 0,
    files: [],
  };
}

import fs from "node:fs/promises";
import path from "node:path";
import type { FileMetadata } from "@codexel/shared";
import { normalizeRelativePath } from "../scanner/ignore-engine";

export interface ParsedManifest {
  filePath: string; // Relative POSIX path, e.g. "package.json" or "apps/web/package.json"
  name?: string;
  version?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

/**
 * Safely parses a single package.json file.
 */
export async function parseSingleManifest(
  absolutePath: string,
  relativePath: string,
): Promise<ParsedManifest | null> {
  try {
    const raw = await fs.readFile(absolutePath, "utf-8");
    const json = JSON.parse(raw);

    return {
      filePath: normalizeRelativePath(relativePath),
      name: typeof json.name === "string" ? json.name : undefined,
      version: typeof json.version === "string" ? json.version : undefined,
      dependencies: json.dependencies && typeof json.dependencies === "object" ? json.dependencies : {},
      devDependencies: json.devDependencies && typeof json.devDependencies === "object" ? json.devDependencies : {},
      peerDependencies: json.peerDependencies && typeof json.peerDependencies === "object" ? json.peerDependencies : {},
      scripts: json.scripts && typeof json.scripts === "object" ? json.scripts : {},
    };
  } catch {
    return null;
  }
}

/**
 * Finds and parses all package.json files in the repository.
 * If scanned files are provided, filters them directly; otherwise inspects root and subdirectories.
 */
export async function parseWorkspaceManifests(
  workspacePath: string,
  scannedFiles?: FileMetadata[],
): Promise<ParsedManifest[]> {
  const manifests: ParsedManifest[] = [];

  if (scannedFiles && scannedFiles.length > 0) {
    const manifestFiles = scannedFiles.filter(
      (f) => path.basename(f.path).toLowerCase() === "package.json",
    );

    for (const file of manifestFiles) {
      const fullPath = path.join(workspacePath, file.path);
      const parsed = await parseSingleManifest(fullPath, file.path);
      if (parsed) {
        manifests.push(parsed);
      }
    }

    return manifests;
  }

  // Fallback: directly read root package.json if no scanned files provided
  const rootPackageJson = path.join(workspacePath, "package.json");
  const parsedRoot = await parseSingleManifest(rootPackageJson, "package.json");
  if (parsedRoot) {
    manifests.push(parsedRoot);
  }

  return manifests;
}

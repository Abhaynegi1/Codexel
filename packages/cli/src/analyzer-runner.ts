import path from "node:path";
import fs from "node:fs/promises";
import { analyzeRepository } from "@codexel/analyzer";
import type { RepositoryModel } from "@codexel/shared";

export interface RunAnalysisOptions {
  targetPath: string;
  onProgress?: (step: string) => void;
}

export async function runCliAnalysis(
  options: RunAnalysisOptions,
): Promise<RepositoryModel> {
  const resolvedPath = path.resolve(process.cwd(), options.targetPath);

  try {
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Target path "${resolvedPath}" is not a directory.`);
    }
  } catch (err: any) {
    if (err.code === "ENOENT") {
      throw new Error(`Directory not found: "${resolvedPath}"`);
    }
    throw err;
  }

  const projectName = path.basename(resolvedPath) || "project";

  if (options.onProgress) {
    options.onProgress("Scanning filesystem & detecting technologies...");
  }

  const model = await analyzeRepository({
    workspacePath: resolvedPath,
    url: `local://cli/${projectName}`,
    owner: "local",
    name: projectName,
    commitSha: "local-cli",
    defaultBranch: "local",
    isPrivate: true,
  });

  return model;
}

import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import type { RepositoryModel } from "@codexel/shared";
import { DEFAULT_INGESTION_LIMITS } from "@codexel/shared";
import { analyzeRepository } from "../index";
import { RepositoryLimitExceededError } from "./errors";

export interface InMemoryFile {
  path: string;
  content: string;
}

export interface AnalyzeInMemoryOptions {
  name: string;
  files: InMemoryFile[];
  owner?: string;
  maxFiles?: number;
  maxSizeBytes?: number;
}

/**
 * Ingests and analyzes an array of in-memory files (from local directory picker or drag-and-drop),
 * writes them into an ephemeral isolated sandbox, executes the full static analysis pipeline,
 * and guarantees cleanup on completion.
 */
export async function analyzeInMemoryFiles(
  options: AnalyzeInMemoryOptions,
): Promise<RepositoryModel> {
  const maxFiles = options.maxFiles ?? DEFAULT_INGESTION_LIMITS.maxFiles;
  const maxSizeBytes =
    options.maxSizeBytes ?? DEFAULT_INGESTION_LIMITS.maxSizeBytes;

  const rawName = (options.name || "local-project").trim();
  const sanitizedName =
    rawName.replace(/[^a-zA-Z0-9._-]/g, "-") || "local-project";
  const owner = options.owner || "local";

  if (options.files.length > maxFiles) {
    throw new RepositoryLimitExceededError(
      "MAX_FILES",
      options.files.length,
      maxFiles,
    );
  }

  let totalBytes = 0;
  for (const file of options.files) {
    totalBytes += Buffer.byteLength(file.content || "", "utf-8");
    if (totalBytes > maxSizeBytes) {
      throw new RepositoryLimitExceededError(
        "MAX_SIZE",
        totalBytes,
        maxSizeBytes,
      );
    }
  }

  const sandboxId = randomUUID();
  const sandboxDir = path.join(
    os.tmpdir(),
    "codexel-sandboxes",
    `local-${sandboxId}`,
  );

  await fs.mkdir(sandboxDir, { recursive: true });

  try {
    // Write all files into the ephemeral sandbox
    for (const file of options.files) {
      // Normalize relative path and prevent directory traversal
      const normalizedRelative = path
        .normalize(file.path)
        .replace(/^(\.\.(\/|\\|$))+/, "")
        .replace(/^[/\\]+/, "");

      const destinationPath = path.join(sandboxDir, normalizedRelative);
      const destinationDir = path.dirname(destinationPath);

      await fs.mkdir(destinationDir, { recursive: true });
      await fs.writeFile(destinationPath, file.content, "utf-8");
    }

    // Run the complete AST analysis engine
    const model = await analyzeRepository({
      workspacePath: sandboxDir,
      url: `local://${owner}/${sanitizedName}`,
      owner,
      name: sanitizedName,
      commitSha: "local-workspace",
      defaultBranch: "local",
      isPrivate: true,
    });

    return model;
  } finally {
    try {
      if (process.platform === "win32") {
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      await fs.rm(sandboxDir, {
        recursive: true,
        force: true,
        maxRetries: 8,
        retryDelay: 100,
      });
    } catch (cleanupErr) {
      console.warn(
        `Local sandbox cleanup warning for ${sandboxDir}:`,
        cleanupErr,
      );
      setTimeout(() => {
        fs.rm(sandboxDir, { recursive: true, force: true }).catch(() => {});
      }, 3000);
    }
  }
}

import * as dotenv from "dotenv";
import { withSandbox, analyzeRepository } from "@codexel/analyzer";
import type { RepositoryModel } from "@codexel/shared";

dotenv.config();

console.log("Codexel Analysis Worker initialized.");
console.log("Ready to process analysis jobs via BullMQ / Redis.");

export async function processAnalysisJob(
  repoUrl: string,
): Promise<RepositoryModel> {
  return await withSandbox(repoUrl, async (sandbox) => {
    const metadata = sandbox.metadata;
    return await analyzeRepository({
      workspacePath: sandbox.path,
      url: sandbox.parsedUrl.cleanUrl,
      owner: sandbox.parsedUrl.owner,
      name: sandbox.parsedUrl.repo,
      commitSha: metadata?.commitSha || "unknown",
      defaultBranch: metadata?.defaultBranch || "main",
      isPrivate: false,
    });
  });
}

export function startWorker() {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  console.log(`Configured Redis connection: ${redisUrl}`);
}

if (process.env.NODE_ENV !== "test" && process.env.RUN_STANDALONE === "true") {
  startWorker();
}

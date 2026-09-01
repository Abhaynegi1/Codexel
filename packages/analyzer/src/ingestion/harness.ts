#!/usr/bin/env tsx
import * as fs from "node:fs";
import { parseGitHubUrl } from "./url-parser";
import { resolveRemoteRepo } from "./remote-resolver";
import { withSandbox } from "./sandbox";

async function main() {
  const args = process.argv.slice(2);
  const targetUrl = args[0] || "https://github.com/octocat/Hello-World";

  console.log("==========================================================");
  console.log(" Codexel Phase 1: Ingestion & Sandbox Verification Harness");
  console.log("==========================================================");
  console.log(`Target URL: ${targetUrl}\n`);

  const startTime = Date.now();

  try {
    // 1. Parse & Normalize URL
    console.log("[1/5] Parsing GitHub URL...");
    const parsed = parseGitHubUrl(targetUrl);
    console.log(`      Owner: ${parsed.owner}`);
    console.log(`      Repo:  ${parsed.repo}`);
    console.log(`      Clean URL: ${parsed.cleanUrl}`);
    console.log(`      Clone URL: ${parsed.cloneUrl}`);
    if (parsed.ref) console.log(`      Ref:   ${parsed.ref}`);

    // 2. Resolve Remote Commit SHA & Default Branch
    console.log("\n[2/5] Resolving Remote Commit SHA via git ls-remote...");
    const remoteInfo = await resolveRemoteRepo(parsed);
    console.log(`      Commit SHA:     ${remoteInfo.commitSha}`);
    console.log(`      Default Branch: ${remoteInfo.defaultBranch}`);
    console.log(`      Resolved Ref:   ${remoteInfo.resolvedRef}`);
    console.log(`      Cache Key:      ${remoteInfo.cacheKey}`);

    // 3. Ephemeral Sandbox Execution
    console.log("\n[3/5] Ingesting into Isolated Ephemeral Sandbox...");
    let sandboxDirTested = "";

    await withSandbox(
      targetUrl,
      async (sandbox) => {
        sandboxDirTested = sandbox.path;
        console.log(`      Ephemeral Path: ${sandbox.path}`);
        console.log(
          `      Clone Duration: ${sandbox.metadata?.cloneDurationMs} ms`,
        );
        console.log(
          `      File Count:     ${sandbox.metadata?.fileCount} files`,
        );
        console.log(
          `      Repo Size:      ${((sandbox.metadata?.sizeBytes || 0) / (1024 * 1024)).toFixed(3)} MB`,
        );

        // 4. Verify directory exists during execution
        console.log("\n[4/5] Inspecting Workspace Contents Inside Sandbox...");
        const existsDuringExecution = fs.existsSync(sandbox.path);
        const filesInside = fs.readdirSync(sandbox.path);
        console.log(`      Directory exists on disk: ${existsDuringExecution}`);
        console.log(`      Top-level items found: [${filesInside.join(", ")}]`);

        if (!existsDuringExecution || filesInside.length === 0) {
          throw new Error(
            "Sandbox directory appears empty or missing during execution.",
          );
        }
      },
      {
        knownCommitSha: remoteInfo.commitSha,
        knownDefaultBranch: remoteInfo.defaultBranch,
      },
    );

    // 5. Verify guaranteed cleanup
    console.log("\n[5/5] Verifying Guaranteed Cleanup Post-Execution...");
    const existsAfterCleanup = fs.existsSync(sandboxDirTested);
    console.log(`      Directory exists post-cleanup: ${existsAfterCleanup}`);

    if (existsAfterCleanup) {
      console.error(
        "❌ ERROR: Sandbox directory was NOT purged after execution!",
      );
      process.exit(1);
    } else {
      console.log("      ✅ Sandbox successfully purged from disk.");
    }

    const totalDuration = Date.now() - startTime;
    console.log("\n----------------------------------------------------------");
    console.log(`🎉 Ingestion & Sandboxing succeeded in ${totalDuration} ms!`);
    console.log("----------------------------------------------------------");
  } catch (error: any) {
    console.error(`\n❌ Ingestion Harness Failed: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

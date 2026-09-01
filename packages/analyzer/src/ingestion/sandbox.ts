import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import type {
  ParsedGitHubUrl,
  IngestionLimits,
  SandboxMetadata,
} from "@codexel/shared";
import { DEFAULT_INGESTION_LIMITS } from "@codexel/shared";
import { parseGitHubUrl } from "./url-parser";
import { resolveRemoteRepo } from "./remote-resolver";
import { verifySandboxBoundaries } from "./safety";
import {
  SandboxCleanupError,
  SandboxTimeoutError,
  IngestionError,
} from "./errors";

const execFileAsync = promisify(execFile);

export interface IngestionOptions {
  limits?: Partial<IngestionLimits>;
  baseTempDir?: string;
  skipRemoteResolve?: boolean; // Useful for tests or pre-resolved commit SHAs
  knownCommitSha?: string;
  knownDefaultBranch?: string;
}

// Global registry of active sandboxes to ensure cleanup on abrupt process exit
const activeSandboxes = new Set<Sandbox>();
let exitHooksRegistered = false;

function registerProcessCleanupHooks(): void {
  if (exitHooksRegistered) return;
  exitHooksRegistered = true;

  const purgeAllSynchronously = () => {
    for (const sandbox of activeSandboxes) {
      try {
        if (fsSync.existsSync(sandbox.path)) {
          fsSync.rmSync(sandbox.path, { recursive: true, force: true });
        }
      } catch {
        // Suppress errors on hard process termination
      }
    }
    activeSandboxes.clear();
  };

  process.on("exit", purgeAllSynchronously);

  process.on("SIGINT", () => {
    purgeAllSynchronously();
    process.exit(130);
  });

  process.on("SIGTERM", () => {
    purgeAllSynchronously();
    process.exit(143);
  });
}

export class Sandbox {
  public readonly id: string;
  public readonly path: string;
  public readonly parsedUrl: ParsedGitHubUrl;
  public readonly limits: IngestionLimits;
  private isCleanedUp = false;
  private _metadata?: SandboxMetadata;

  constructor(options: {
    id: string;
    path: string;
    parsedUrl: ParsedGitHubUrl;
    limits: IngestionLimits;
  }) {
    this.id = options.id;
    this.path = options.path;
    this.parsedUrl = options.parsedUrl;
    this.limits = options.limits;

    activeSandboxes.add(this);
    registerProcessCleanupHooks();
  }

  public get metadata(): SandboxMetadata | undefined {
    return this._metadata;
  }

  public setMetadata(metadata: SandboxMetadata): void {
    this._metadata = metadata;
  }

  /**
   * Cleans up the ephemeral sandbox directory.
   * Includes exponential backoff retries to handle locked file handles on Windows.
   */
  public async cleanup(): Promise<void> {
    if (this.isCleanedUp) return;

    activeSandboxes.delete(this);

    let attempts = 0;
    const maxAttempts = 5;
    let delayMs = 50;

    while (attempts < maxAttempts) {
      try {
        await fs.rm(this.path, { recursive: true, force: true });
        this.isCleanedUp = true;
        return;
      } catch (err: any) {
        attempts += 1;
        if (err.code === "ENOENT") {
          this.isCleanedUp = true;
          return;
        }

        if (attempts >= maxAttempts) {
          throw new SandboxCleanupError(this.path, err);
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
      }
    }
  }
}

/**
 * Creates an ephemeral sandbox, clones the repository shallowly,
 * validates safety limits, and returns the Sandbox instance.
 */
export async function createSandbox(
  rawUrl: string,
  options: IngestionOptions = {},
): Promise<Sandbox> {
  const limits: IngestionLimits = {
    ...DEFAULT_INGESTION_LIMITS,
    ...options.limits,
  };

  const parsedUrl = parseGitHubUrl(rawUrl);

  // 1. Resolve remote commit SHA and branch metadata unless skipped
  let commitSha = options.knownCommitSha;
  let defaultBranch = options.knownDefaultBranch || "main";

  if (!commitSha && !options.skipRemoteResolve) {
    const remoteInfo = await resolveRemoteRepo(parsedUrl, {
      timeoutMs: limits.remoteTimeoutMs,
    });
    commitSha = remoteInfo.commitSha;
    defaultBranch = remoteInfo.defaultBranch;
  } else if (!commitSha) {
    commitSha = "unknown-sha";
  }

  // 2. Prepare ephemeral workspace directory
  const baseDir =
    options.baseTempDir || path.join(os.tmpdir(), "codexel-sandboxes");
  const sandboxId = randomUUID();
  const sandboxPath = path.join(baseDir, `sandbox-${sandboxId}`);

  await fs.mkdir(sandboxPath, { recursive: true });

  const sandbox = new Sandbox({
    id: sandboxId,
    path: sandboxPath,
    parsedUrl,
    limits,
  });

  const cloneStart = Date.now();

  try {
    // 3. Construct git clone arguments: shallow, single branch, CRLF normalization
    const gitArgs = [
      "clone",
      "--depth",
      "1",
      "--config",
      "core.autocrlf=false",
    ];

    if (parsedUrl.ref) {
      gitArgs.push("--branch", parsedUrl.ref);
    }

    gitArgs.push(parsedUrl.cloneUrl, sandboxPath);

    await execFileAsync("git", gitArgs, {
      timeout: limits.fetchTimeoutMs,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
      },
      windowsHide: true,
    });

    const cloneDurationMs = Date.now() - cloneStart;

    // 4. Validate safety boundaries (file count & repo byte size)
    const boundaries = await verifySandboxBoundaries(sandboxPath, {
      limits,
      excludeGitDir: false,
    });

    sandbox.setMetadata({
      ephemeralPath: sandboxPath,
      owner: parsedUrl.owner,
      repo: parsedUrl.repo,
      commitSha: commitSha || "unknown",
      defaultBranch,
      fileCount: boundaries.fileCount,
      sizeBytes: boundaries.totalSizeBytes,
      clonedAt: new Date().toISOString(),
      cloneDurationMs,
    });

    return sandbox;
  } catch (error: any) {
    // Guaranteed cleanup if provisioning fails or limit is breached
    await sandbox.cleanup();

    if (error?.killed && error?.signal === "SIGTERM") {
      throw new SandboxTimeoutError("clone", limits.fetchTimeoutMs);
    }

    if (error instanceof IngestionError) {
      throw error;
    }

    const stderr = (error?.stderr || error?.message || "").toString();
    throw new IngestionError(
      `Failed to clone repository into sandbox: ${stderr.trim()}`,
    );
  }
}

/**
 * Context manager wrapper that creates an ephemeral sandbox, executes an action,
 * and guarantees cleanup in a finally block even if errors are thrown.
 */
export async function withSandbox<T>(
  targetUrl: string,
  fn: (sandbox: Sandbox) => Promise<T>,
  options?: IngestionOptions,
): Promise<T> {
  const sandbox = await createSandbox(targetUrl, options);
  try {
    return await fn(sandbox);
  } finally {
    await sandbox.cleanup();
  }
}

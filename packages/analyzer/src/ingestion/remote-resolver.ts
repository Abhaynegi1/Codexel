import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ParsedGitHubUrl, RemoteRepoInfo } from "@codexel/shared";
import { RemoteResolutionError, SandboxTimeoutError } from "./errors";

const execFileAsync = promisify(execFile);

export interface ResolveRemoteOptions {
  timeoutMs?: number;
}

const DEFAULT_REMOTE_TIMEOUT_MS = 30_000;

/**
 * Queries remote repository metadata using `git ls-remote`.
 * Resolves the target commit SHA, default branch, and deterministic cache key
 * without downloading the repository payload.
 */
export async function resolveRemoteRepo(
  parsedUrl: ParsedGitHubUrl,
  options: ResolveRemoteOptions = {},
): Promise<RemoteRepoInfo> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_REMOTE_TIMEOUT_MS;
  const { cloneUrl, owner, repo, ref } = parsedUrl;

  const env = {
    ...process.env,
    GIT_TERMINAL_PROMPT: "0", // Prevent git from hanging on credentials prompt
  };

  try {
    if (!ref) {
      // Query HEAD with --symref to discover the default branch and its commit SHA
      const { stdout } = await execFileAsync(
        "git",
        ["ls-remote", "--symref", cloneUrl, "HEAD"],
        {
          timeout: timeoutMs,
          env,
          windowsHide: true,
        },
      );

      const parsed = parseLsRemoteSymrefOutput(stdout);
      if (!parsed.commitSha) {
        throw new RemoteResolutionError(
          cloneUrl,
          undefined,
          "Remote returned empty response for HEAD ref.",
        );
      }

      const defaultBranch = parsed.defaultBranch || "main";
      const cacheKey = `codexel:repo:${owner.toLowerCase()}:${repo.toLowerCase()}:${parsed.commitSha}`;

      return {
        commitSha: parsed.commitSha,
        defaultBranch,
        resolvedRef: parsed.resolvedRef || `refs/heads/${defaultBranch}`,
        cacheKey,
      };
    }

    // Specific ref was provided (branch, tag, or commit)
    const targetRefPatterns = [
      ref,
      `refs/heads/${ref}`,
      `refs/tags/${ref}`,
      `refs/tags/${ref}^{}`,
    ];

    const { stdout } = await execFileAsync(
      "git",
      ["ls-remote", cloneUrl, ...targetRefPatterns],
      {
        timeout: timeoutMs,
        env,
        windowsHide: true,
      },
    );

    const resolved = parseLsRemoteRefOutput(stdout, ref);
    if (!resolved.commitSha) {
      // If direct ref lookup returned nothing, check if the input is already a 40-char commit SHA
      if (/^[0-9a-fA-F]{40}$/.test(ref)) {
        return {
          commitSha: ref.toLowerCase(),
          defaultBranch: "main",
          resolvedRef: ref,
          cacheKey: `codexel:repo:${owner.toLowerCase()}:${repo.toLowerCase()}:${ref.toLowerCase()}`,
        };
      }

      throw new RemoteResolutionError(
        cloneUrl,
        ref,
        `Ref "${ref}" could not be found on remote.`,
      );
    }

    const defaultBranch = ref;
    const cacheKey = `codexel:repo:${owner.toLowerCase()}:${repo.toLowerCase()}:${resolved.commitSha}`;

    return {
      commitSha: resolved.commitSha,
      defaultBranch,
      resolvedRef: resolved.resolvedRef,
      cacheKey,
    };
  } catch (error: any) {
    if (error?.killed && error?.signal === "SIGTERM") {
      throw new SandboxTimeoutError("remote-resolve", timeoutMs);
    }

    if (
      error instanceof RemoteResolutionError ||
      error instanceof SandboxTimeoutError
    ) {
      throw error;
    }

    const stderr = (error?.stderr || error?.message || "").toString();
    if (
      stderr.includes("Repository not found") ||
      stderr.includes("Authentication failed") ||
      stderr.includes("could not read Username")
    ) {
      throw new RemoteResolutionError(
        cloneUrl,
        ref,
        "Repository not found, is private, or requires authentication.",
      );
    }

    throw new RemoteResolutionError(
      cloneUrl,
      ref,
      stderr.trim() || error?.message || "Unknown error during git ls-remote.",
    );
  }
}

/**
 * Parses stdout from `git ls-remote --symref <url> HEAD`
 * Output typically looks like:
 * ref: refs/heads/main	HEAD
 * 1234567890abcdef1234567890abcdef12345678	HEAD
 */
export function parseLsRemoteSymrefOutput(stdout: string): {
  defaultBranch?: string;
  commitSha?: string;
  resolvedRef?: string;
} {
  let defaultBranch: string | undefined;
  let commitSha: string | undefined;
  let resolvedRef: string | undefined;

  const lines = stdout.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("ref: refs/heads/")) {
      const match = trimmed.match(/^ref:\s+refs\/heads\/([^\s\t]+)/);
      if (match) {
        defaultBranch = match[1];
        resolvedRef = `refs/heads/${match[1]}`;
      }
    } else {
      const parts = trimmed.split(/\s+/);
      const firstPart = parts[0];
      if (
        parts.length >= 2 &&
        firstPart &&
        /^[0-9a-fA-F]{40,64}$/.test(firstPart)
      ) {
        commitSha = firstPart;
      }
    }
  }

  return { defaultBranch, commitSha, resolvedRef };
}

/**
 * Parses stdout for specific refs from `git ls-remote <url> <refs...>`
 * Handles annotated tags (which output `refs/tags/v1.0.0^{}` with the peeled commit SHA).
 */
export function parseLsRemoteRefOutput(
  stdout: string,
  targetRef: string,
): { commitSha?: string; resolvedRef: string } {
  const lines = stdout.split(/\r?\n/);
  let commitSha: string | undefined;
  let matchedRef = targetRef;

  // Annotated tags produce two entries; the peeled tag `^{}` contains the actual target commit SHA
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [sha, refName] = trimmed.split(/\s+/);
    if (!sha || !refName) continue;

    if (refName.endsWith("^{}")) {
      commitSha = sha;
      matchedRef = refName;
      break;
    } else if (!commitSha) {
      commitSha = sha;
      matchedRef = refName;
    }
  }

  return { commitSha, resolvedRef: matchedRef };
}

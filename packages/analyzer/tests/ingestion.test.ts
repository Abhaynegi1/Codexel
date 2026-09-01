import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  parseGitHubUrl,
  verifySandboxBoundaries,
  parseLsRemoteSymrefOutput,
  parseLsRemoteRefOutput,
  withSandbox,
  InvalidGitHubUrlError,
  RepositoryLimitExceededError,
} from "../src/ingestion/index";

describe("GitHub URL Parser & Normalizer", () => {
  it("parses standard https GitHub URLs", () => {
    const result = parseGitHubUrl("https://github.com/facebook/react");
    expect(result).toEqual({
      owner: "facebook",
      repo: "react",
      cleanUrl: "https://github.com/facebook/react",
      cloneUrl: "https://github.com/facebook/react.git",
    });
  });

  it("handles URLs with .git suffix and trailing slash", () => {
    const result = parseGitHubUrl("https://github.com/vercel/next.js.git/");
    expect(result.owner).toBe("vercel");
    expect(result.repo).toBe("next.js");
    expect(result.cleanUrl).toBe("https://github.com/vercel/next.js");
    expect(result.cloneUrl).toBe("https://github.com/vercel/next.js.git");
  });

  it("handles protocol-less github.com URLs", () => {
    const result = parseGitHubUrl("github.com/tailwindlabs/tailwindcss");
    expect(result.owner).toBe("tailwindlabs");
    expect(result.repo).toBe("tailwindcss");
  });

  it("parses tree URLs with branch references", () => {
    const result = parseGitHubUrl("https://github.com/shadcn-ui/ui/tree/main");
    expect(result.owner).toBe("shadcn-ui");
    expect(result.repo).toBe("ui");
    expect(result.ref).toBe("main");
  });

  it("parses tree URLs with nested subpaths", () => {
    const result = parseGitHubUrl(
      "https://github.com/shadcn-ui/ui/tree/canary/apps/www",
    );
    expect(result.owner).toBe("shadcn-ui");
    expect(result.repo).toBe("ui");
    expect(result.ref).toBe("canary");
    expect(result.subpath).toBe("apps/www");
  });

  it("parses blob URLs", () => {
    const result = parseGitHubUrl(
      "https://github.com/octocat/Hello-World/blob/master/README",
    );
    expect(result.owner).toBe("octocat");
    expect(result.repo).toBe("Hello-World");
    expect(result.ref).toBe("master");
    expect(result.subpath).toBe("README");
  });

  it("rejects non-GitHub domains", () => {
    expect(() => parseGitHubUrl("https://gitlab.com/owner/repo")).toThrow(
      InvalidGitHubUrlError,
    );
    expect(() => parseGitHubUrl("https://bitbucket.org/owner/repo")).toThrow(
      InvalidGitHubUrlError,
    );
  });

  it("rejects command injection flags starting with hyphens", () => {
    expect(() => parseGitHubUrl("--upload-pack=exploit")).toThrow(
      InvalidGitHubUrlError,
    );
    expect(() => parseGitHubUrl("https://github.com/-malicious/repo")).toThrow(
      InvalidGitHubUrlError,
    );
    expect(() => parseGitHubUrl("https://github.com/owner/-malicious")).toThrow(
      InvalidGitHubUrlError,
    );
  });

  it("rejects malicious characters in branch refs", () => {
    expect(() =>
      parseGitHubUrl("https://github.com/owner/repo/tree/branch..evil"),
    ).toThrow(InvalidGitHubUrlError);
    expect(() =>
      parseGitHubUrl("https://github.com/owner/repo/tree/branch~1"),
    ).toThrow(InvalidGitHubUrlError);
    expect(() =>
      parseGitHubUrl("https://github.com/owner/repo/tree/branch^1"),
    ).toThrow(InvalidGitHubUrlError);
  });
});

describe("Remote Resolver Output Parsers", () => {
  it("parses symref output for default branch and commit SHA", () => {
    const sampleOutput = `ref: refs/heads/main\tHEAD\n7fd1a60b01f91b314f59955a4e4d4e80d8edf11d\tHEAD\n`;
    const result = parseLsRemoteSymrefOutput(sampleOutput);
    expect(result.defaultBranch).toBe("main");
    expect(result.commitSha).toBe("7fd1a60b01f91b314f59955a4e4d4e80d8edf11d");
    expect(result.resolvedRef).toBe("refs/heads/main");
  });

  it("parses specific refs output and resolves peeled tags", () => {
    const sampleOutput = `
aaaa111122223333444455556666777788889999\trefs/tags/v1.0.0
bbbb111122223333444455556666777788889999\trefs/tags/v1.0.0^{}
`;
    const result = parseLsRemoteRefOutput(sampleOutput, "v1.0.0");
    expect(result.commitSha).toBe("bbbb111122223333444455556666777788889999");
    expect(result.resolvedRef).toBe("refs/tags/v1.0.0^{}");
  });
});

describe("Safety Boundary Enforcement", () => {
  const testDir = path.join(os.tmpdir(), "codexel-safety-test-" + Date.now());

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignored
    }
  });

  it("calculates file count and byte size within limits", async () => {
    await fs.writeFile(path.join(testDir, "file1.txt"), "hello world");
    await fs.writeFile(
      path.join(testDir, "file2.txt"),
      "codexel deterministic",
    );

    const result = await verifySandboxBoundaries(testDir, {
      limits: { maxFiles: 10, maxSizeBytes: 1000 },
    });

    expect(result.fileCount).toBe(2);
    expect(result.totalSizeBytes).toBeGreaterThan(0);
  });

  it("throws RepositoryLimitExceededError when maxFiles is exceeded", async () => {
    await fs.writeFile(path.join(testDir, "f1.txt"), "1");
    await fs.writeFile(path.join(testDir, "f2.txt"), "2");
    await fs.writeFile(path.join(testDir, "f3.txt"), "3");

    await expect(
      verifySandboxBoundaries(testDir, {
        limits: { maxFiles: 2, maxSizeBytes: 10_000 },
      }),
    ).rejects.toThrow(RepositoryLimitExceededError);
  });

  it("throws RepositoryLimitExceededError when maxSizeBytes is exceeded", async () => {
    const largeBuffer = Buffer.alloc(2000, "a");
    await fs.writeFile(path.join(testDir, "large.bin"), largeBuffer);

    await expect(
      verifySandboxBoundaries(testDir, {
        limits: { maxFiles: 100, maxSizeBytes: 1000 },
      }),
    ).rejects.toThrow(RepositoryLimitExceededError);
  });
});

describe("Sandbox Lifecycle & Guaranteed Cleanup", () => {
  it("guarantees ephemeral sandbox directory cleanup on completion", async () => {
    let capturedPath = "";

    await withSandbox(
      "https://github.com/octocat/Hello-World",
      async (sandbox) => {
        capturedPath = sandbox.path;
        expect(fsSync.existsSync(capturedPath)).toBe(true);

        const files = await fs.readdir(capturedPath);
        expect(files.length).toBeGreaterThan(0);
        expect(sandbox.metadata?.fileCount).toBeGreaterThan(0);
        expect(sandbox.metadata?.commitSha).toBeDefined();
      },
      {
        limits: { fetchTimeoutMs: 30_000 },
      },
    );

    // After withSandbox finishes, the ephemeral directory MUST have been purged
    expect(capturedPath).not.toBe("");
    expect(fsSync.existsSync(capturedPath)).toBe(false);
  });

  it("guarantees cleanup even when the user function throws an error", async () => {
    let capturedPath = "";

    await expect(
      withSandbox(
        "https://github.com/octocat/Hello-World",
        async (sandbox) => {
          capturedPath = sandbox.path;
          expect(fsSync.existsSync(capturedPath)).toBe(true);
          throw new Error("Simulated failure inside worker callback");
        },
        {
          limits: { fetchTimeoutMs: 30_000 },
        },
      ),
    ).rejects.toThrow("Simulated failure inside worker callback");

    expect(capturedPath).not.toBe("");
    expect(fsSync.existsSync(capturedPath)).toBe(false);
  });
});

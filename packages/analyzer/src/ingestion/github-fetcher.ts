import type { RepositoryModel } from "@codexel/shared";
import { analyzeInMemoryFiles, type InMemoryFile } from "./local-analyzer";

export interface GitHubRepoCheckResult {
  isPrivate: boolean;
  defaultBranch?: string;
  files: InMemoryFile[];
}

const IGNORE_PATTERNS = [
  /node_modules/i,
  /\.git\//i,
  /\.next\//i,
  /dist\//i,
  /build\//i,
  /\.turbo\//i,
  /\.husky\//i,
  /coverage\//i,
  /pnpm-lock\.yaml$/i,
  /package-lock\.json$/i,
  /yarn\.lock$/i,
  /\.d\.ts$/i,
  /\.test\.(ts|tsx|js|jsx)$/i,
  /\.spec\.(ts|tsx|js|jsx)$/i,
  /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|mp4|webm|lottie)$/i,
];

function shouldIncludeFile(filePath: string): boolean {
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(filePath)) return false;
  }
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".css",
    ".scss",
    ".prisma",
    ".sql",
    ".md",
  ].includes(ext);
}

function getFilePriority(filePath: string): number {
  const lower = filePath.toLowerCase();
  if (lower.endsWith("package.json")) return 100;
  if (lower.includes("tailwind.config")) return 90;
  if (lower.includes("tsconfig.json")) return 85;
  if (lower.includes("components/")) return 80;
  if (lower.includes("app/") || lower.includes("pages/")) return 75;
  if (lower.includes("schema")) return 70;
  if (lower.includes("routes/")) return 65;
  if (lower.includes("lib/") || lower.includes("utils/")) return 60;
  return 10;
}

/**
 * Fetches real repository files directly from GitHub's REST and Raw APIs
 * without requiring the git CLI. Ideal for serverless environments (e.g. Vercel).
 */
export async function fetchGitHubRepoFiles(
  owner: string,
  repo: string,
  maxFilesToFetch = 60,
): Promise<GitHubRepoCheckResult> {
  const headers = {
    "User-Agent": "Codexel-Analyzer",
    Accept: "application/vnd.github.v3+json",
  };

  // 1. Check repository visibility and default branch
  let defaultBranch = "main";
  try {
    const metaRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers, signal: AbortSignal.timeout(6000) },
    );

    if (metaRes.status === 404) {
      return { isPrivate: true, files: [] };
    }

    if (metaRes.ok) {
      const meta = await metaRes.json();
      if (meta.private === true) {
        return { isPrivate: true, files: [] };
      }
      if (meta.default_branch) {
        defaultBranch = meta.default_branch;
      }
    }
  } catch (err) {
    console.warn("GitHub metadata check warning:", err);
  }

  // 2. Fetch the repository git tree recursively
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers, signal: AbortSignal.timeout(8000) },
    );

    if (treeRes.status === 404) {
      return { isPrivate: true, files: [] };
    }

    if (!treeRes.ok) {
      return { isPrivate: false, defaultBranch, files: [] };
    }

    const treeData = await treeRes.json();
    const tree: Array<{ path: string; type: string; size?: number }> =
      treeData.tree || [];

    // Filter to relevant source and config files
    const relevantBlobs = tree
      .filter((item) => item.type === "blob" && shouldIncludeFile(item.path))
      .sort((a, b) => getFilePriority(b.path) - getFilePriority(a.path))
      .slice(0, maxFilesToFetch);

    // 3. Concurrently fetch raw file contents from raw.githubusercontent.com
    const files: InMemoryFile[] = [];
    const BATCH_SIZE = 12;

    for (let i = 0; i < relevantBlobs.length; i += BATCH_SIZE) {
      const batch = relevantBlobs.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (item) => {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${item.path}`;
          const res = await fetch(rawUrl, {
            signal: AbortSignal.timeout(6000),
          });
          if (res.ok) {
            const content = await res.text();
            return { path: item.path, content };
          }
          return null;
        }),
      );

      for (const res of results) {
        if (res.status === "fulfilled" && res.value && res.value.content) {
          files.push(res.value);
        }
      }
    }

    return {
      isPrivate: false,
      defaultBranch,
      files,
    };
  } catch (err) {
    console.warn("GitHub tree fetch error:", err);
    return { isPrivate: false, defaultBranch, files: [] };
  }
}

/**
 * Analyzes a remote GitHub repository by fetching its real files via GitHub APIs
 * and running them through the AST analyzer. Guarantees 0 mock data.
 */
export async function analyzeRemoteGitHubRepoWithoutGit(
  owner: string,
  repo: string,
  maxFiles = 60,
): Promise<{
  isPrivate: boolean;
  model: RepositoryModel | null;
}> {
  const { isPrivate, defaultBranch, files } = await fetchGitHubRepoFiles(
    owner,
    repo,
    maxFiles,
  );

  if (isPrivate) {
    return { isPrivate: true, model: null };
  }

  if (files.length === 0) {
    return { isPrivate: false, model: null };
  }

  const model = await analyzeInMemoryFiles({
    name: repo,
    owner,
    files,
  });

  // Ensure metadata reflects the actual public GitHub URL
  model.metadata.url = `https://github.com/${owner}/${repo}`;
  model.metadata.owner = owner;
  model.metadata.name = repo;
  model.metadata.defaultBranch = defaultBranch || "main";
  model.metadata.isPrivate = false;

  return { isPrivate: false, model };
}

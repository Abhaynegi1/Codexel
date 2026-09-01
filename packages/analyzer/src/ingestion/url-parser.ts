import type { ParsedGitHubUrl } from "@codexel/shared";
import { InvalidGitHubUrlError } from "./errors";

const VALID_IDENTIFIER_REGEX = /^[a-zA-Z0-9_.-]+$/;
const DISALLOWED_REF_CHARS_REGEX = /[\s~^:?*\[\\@{]/;

/**
 * Validates and normalizes a GitHub repository URL into a structured format.
 *
 * Supported formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - http://github.com/owner/repo
 * - github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch-name
 * - https://github.com/owner/repo/tree/branch/nested/path
 * - https://github.com/owner/repo/blob/branch/path/to/file
 */
export function parseGitHubUrl(inputUrl: string): ParsedGitHubUrl {
  if (!inputUrl || typeof inputUrl !== "string") {
    throw new InvalidGitHubUrlError(
      String(inputUrl),
      "URL must be a non-empty string.",
    );
  }

  const trimmed = inputUrl.trim();

  // Guard against command injection / flag injection
  if (trimmed.startsWith("-")) {
    throw new InvalidGitHubUrlError(
      trimmed,
      "URL cannot start with a hyphen/flag.",
    );
  }

  let urlToParse = trimmed;
  if (!/^https?:\/\//i.test(urlToParse)) {
    urlToParse = `https://${urlToParse}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlToParse);
  } catch {
    throw new InvalidGitHubUrlError(inputUrl, "Malformed URL format.");
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    throw new InvalidGitHubUrlError(
      inputUrl,
      `Only public GitHub repositories are supported (received host: ${host}).`,
    );
  }

  // Remove leading and trailing slashes, split path segments
  const pathParts = parsed.pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);

  if (pathParts.length < 2) {
    throw new InvalidGitHubUrlError(
      inputUrl,
      "URL must specify both an owner and a repository name (e.g., github.com/owner/repo).",
    );
  }

  const rawOwner = pathParts[0];
  const rawRepo = pathParts[1];
  if (!rawOwner || !rawRepo) {
    throw new InvalidGitHubUrlError(
      inputUrl,
      "URL must specify both an owner and a repository name (e.g., github.com/owner/repo).",
    );
  }

  const rest = pathParts.slice(2);

  // Strip .git from repo name if present
  const owner = rawOwner.trim();
  const repo = rawRepo.replace(/\.git$/i, "").trim();

  // Validate owner & repo characters
  if (!VALID_IDENTIFIER_REGEX.test(owner) || owner.startsWith("-")) {
    throw new InvalidGitHubUrlError(
      inputUrl,
      `Invalid repository owner name: "${owner}".`,
    );
  }
  if (
    !VALID_IDENTIFIER_REGEX.test(repo) ||
    repo.startsWith("-") ||
    repo.length === 0
  ) {
    throw new InvalidGitHubUrlError(
      inputUrl,
      `Invalid repository name: "${repo}".`,
    );
  }

  let ref: string | undefined;
  let subpath: string | undefined;

  // Handle /tree/:ref/... or /blob/:ref/...
  if (rest.length >= 2 && (rest[0] === "tree" || rest[0] === "blob")) {
    const afterAction = rest.slice(1);
    const firstSegment = afterAction[0];
    if (!firstSegment) {
      throw new InvalidGitHubUrlError(
        inputUrl,
        "Missing ref after /tree/ or /blob/.",
      );
    }
    const candidateRef = decodeURIComponent(firstSegment);
    if (validateRefString(candidateRef)) {
      ref = candidateRef;
      if (afterAction.length > 1) {
        subpath = afterAction.slice(1).map(decodeURIComponent).join("/");
      }
    } else {
      throw new InvalidGitHubUrlError(
        inputUrl,
        `Invalid git ref: "${candidateRef}".`,
      );
    }
  }

  const cleanUrl = `https://github.com/${owner}/${repo}`;
  const cloneUrl = `https://github.com/${owner}/${repo}.git`;

  return {
    owner,
    repo,
    cleanUrl,
    cloneUrl,
    ...(ref ? { ref } : {}),
    ...(subpath ? { subpath } : {}),
  };
}

/**
 * Validates that a git ref does not contain malicious characters or dangerous command options.
 */
function validateRefString(ref: string): boolean {
  if (!ref || ref.startsWith("-") || ref.includes("..")) {
    return false;
  }
  if (DISALLOWED_REF_CHARS_REGEX.test(ref)) {
    return false;
  }
  return true;
}

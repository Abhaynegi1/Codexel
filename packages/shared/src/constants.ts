export const CURRENT_SCHEMA_VERSION = "1.0.0" as const;
export const ANALYZER_ENGINE_VERSION = "0.1.0" as const;

export const DEFAULT_ANALYZER_LIMITS = {
  MAX_FILES: 10_000,
  MAX_REPO_SIZE_BYTES: 150 * 1024 * 1024, // 150 MB
  TIMEOUT_MS: 90_000, // 90 seconds
} as const;

export const DEFAULT_IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.next/**",
  "**/dist/**",
  "**/build/**",
  "**/out/**",
  "**/coverage/**",
  "**/.cache/**",
  "**/.turbo/**",
  "**/*.log",
  "**/pnpm-lock.yaml",
  "**/package-lock.json",
  "**/yarn.lock",
  "**/.DS_Store",
  "**/Thumbs.db",
] as const;

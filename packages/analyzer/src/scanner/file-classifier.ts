import path from "node:path";

export const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".vue",
  ".svelte",
  ".astro",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".html",
  ".graphql",
  ".gql",
  ".sql",
]);

export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".mts": "TypeScript",
  ".cts": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".vue": "Vue",
  ".svelte": "Svelte",
  ".astro": "Astro",
  ".css": "CSS",
  ".scss": "SCSS",
  ".sass": "Sass",
  ".less": "Less",
  ".html": "HTML",
  ".json": "JSON",
  ".md": "Markdown",
  ".mdx": "Markdown",
  ".sql": "SQL",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".rb": "Ruby",
  ".php": "PHP",
  ".sh": "Shell",
  ".bash": "Shell",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".toml": "TOML",
  ".xml": "XML",
  ".svg": "SVG",
};

/**
 * Checks if a relative file path represents a configuration or setup file.
 */
export function isConfigFile(filePath: string): boolean {
  const baseName = path.basename(filePath).toLowerCase();

  // Explicit config filenames
  if (
    baseName === "package.json" ||
    baseName === "turbo.json" ||
    baseName === "components.json" ||
    baseName === "dockerfile" ||
    baseName.startsWith("docker-compose") ||
    baseName.startsWith(".env") ||
    baseName.startsWith(".editorconfig") ||
    baseName.startsWith(".prettierrc") ||
    baseName.startsWith(".eslintrc")
  ) {
    return true;
  }

  // TypeScript configs
  if (baseName.startsWith("tsconfig") && baseName.endsWith(".json")) {
    return true;
  }

  // Common tool configs: vite.config.*, next.config.*, tailwind.config.*, drizzle.config.*, vitest.config.*, etc.
  if (
    baseName.includes(".config.") ||
    baseName.endsWith(".rc") ||
    baseName.includes("rc.")
  ) {
    return true;
  }

  return false;
}

/**
 * Classifies a file by source vs config and maps its language.
 */
export function classifyFile(filePath: string): {
  extension: string;
  isSource: boolean;
  isConfig: boolean;
  language: string;
} {
  const ext = path.extname(filePath).toLowerCase();
  const isSource = SOURCE_EXTENSIONS.has(ext);
  const isConfig = isConfigFile(filePath);
  const language =
    EXTENSION_TO_LANGUAGE[ext] ||
    (ext ? ext.slice(1).toUpperCase() : "Unknown");

  return {
    extension: ext,
    isSource,
    isConfig,
    language,
  };
}

import path from "node:path";
import fs from "node:fs/promises";
import type {
  DiscoveredComponent,
  ComponentBundle,
  ComponentBundleFile,
  PackageDependencyRequirement,
  FileMetadata,
} from "@codexel/shared";
import type { FileAstSummary } from "../parsers/ast-walker";
import type { AliasResolver } from "../parsers/alias-resolver";

export interface ComputeClosureOptions {
  componentId: string;
  workspacePath?: string;
  components: DiscoveredComponent[];
  fileSystemFiles?: FileMetadata[];
  astSummaries?: Map<string, FileAstSummary>;
  resolver?: AliasResolver;
  packageDependencies?: Record<string, string>;
  fileContentGetter?: (
    filePath: string,
  ) => Promise<string | undefined> | string | undefined;
}

function classifyFileType(
  filePath: string,
  isComponent: boolean,
): ComponentBundleFile["fileType"] {
  const lower = filePath.toLowerCase();
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".css" || ext === ".scss" || ext === ".sass" || ext === ".less") {
    return "style";
  }

  if (
    lower.includes("config.") ||
    lower.includes(".config.") ||
    lower.includes("tsconfig")
  ) {
    return "config";
  }

  if (
    lower.includes("/lib/") ||
    lower.includes("/utils") ||
    lower.includes("utils.") ||
    lower.includes("helper") ||
    lower.includes("variant") ||
    lower.includes("theme.")
  ) {
    return "utility";
  }

  if (isComponent || ext === ".tsx" || ext === ".jsx") {
    return "component";
  }

  return "other";
}

function extractNpmPackageRoot(specifier: string): string {
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    return parts.slice(0, 2).join("/");
  }
  return specifier.split("/")[0] || specifier;
}

import { scanFileSystem } from "../scanner/index";
import { parseSourceFileAst } from "../parsers/ast-walker";
import { createAliasResolver } from "../parsers/alias-resolver";

const PARSABLE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const EXTENSIONS_TO_TRY = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
];

/**
 * Traverses the local import dependency graph from a target component
 * to generate a complete transitive dependency closure bundle.
 */
export async function computeComponentClosure(
  options: ComputeClosureOptions,
): Promise<ComponentBundle> {
  const {
    componentId,
    workspacePath,
    components,
    astSummaries,
    packageDependencies = {},
    fileContentGetter,
  } = options;

  let knownFiles = options.fileSystemFiles || [];
  if (knownFiles.length === 0 && workspacePath) {
    try {
      const scanned = await scanFileSystem({ workspacePath });
      knownFiles = scanned.files;
    } catch {
      // Fallback
    }
  }

  const knownFileSet = new Set(
    knownFiles.map((f) => f.path.replace(/\\/g, "/").replace(/^\.\//, "")),
  );
  // Also populate knownFileSet from components
  for (const c of components) {
    knownFileSet.add(c.filePath.replace(/\\/g, "/").replace(/^\.\//, ""));
    for (const d of c.localDependencies) {
      knownFileSet.add(d.replace(/\\/g, "/").replace(/^\.\//, ""));
    }
  }

  let activeResolver = options.resolver;
  if (!activeResolver && workspacePath) {
    activeResolver = await createAliasResolver(workspacePath, knownFiles);
  }

  function normalizeLocalPath(rawPath: string): string {
    let normalized = rawPath.replace(/\\/g, "/").replace(/^\.\//, "");
    if (knownFileSet.has(normalized)) {
      return normalized;
    }

    const ext = path.extname(normalized);
    if (!ext) {
      for (const e of EXTENSIONS_TO_TRY) {
        const withExt = `${normalized}${e}`;
        if (knownFileSet.has(withExt)) {
          return withExt;
        }
      }
      for (const e of EXTENSIONS_TO_TRY) {
        const indexWithExt = `${normalized}/index${e}`;
        if (knownFileSet.has(indexWithExt)) {
          return indexWithExt;
        }
      }
    }

    return normalized;
  }

  const targetComponent = components.find(
    (c) => c.id === componentId || c.name === componentId,
  );

  if (!targetComponent) {
    throw new Error(
      `Target component "${componentId}" not found in component inventory.`,
    );
  }

  const rootFilePath = normalizeLocalPath(targetComponent.filePath);
  const visitedFiles = new Set<string>();
  const fileContentCache = new Map<string, string>();
  const queue: string[] = [rootFilePath];
  visitedFiles.add(rootFilePath);

  const allExternalPackages = new Set<string>();

  async function getFileContent(filePath: string): Promise<string> {
    if (fileContentCache.has(filePath)) {
      return fileContentCache.get(filePath)!;
    }

    let content = "";
    if (fileContentGetter) {
      const retrieved = await fileContentGetter(filePath);
      if (typeof retrieved === "string") {
        content = retrieved;
      }
    }

    if (!content && workspacePath) {
      try {
        const fullPath = path.isAbsolute(filePath)
          ? filePath
          : path.join(workspacePath, filePath);
        content = await fs.readFile(fullPath, "utf-8");
      } catch {
        // Fall back
      }
    }

    if (!content) {
      const compForFile = components.find((c) => c.filePath === filePath);
      if (compForFile?.sourceCode) {
        content = compForFile.sourceCode;
      } else {
        content = `// Source file: ${filePath}\n// Content loaded from project model.`;
      }
    }

    fileContentCache.set(filePath, content);
    return content;
  }

  // 1. Traverse transitive dependency graph
  while (queue.length > 0) {
    const currentFile = queue.shift()!;
    const matchingComponents = components.filter(
      (c) => normalizeLocalPath(c.filePath) === currentFile,
    );

    // Collect external packages from matching component records
    for (const comp of matchingComponents) {
      for (const pkg of comp.externalPackageDependencies) {
        allExternalPackages.add(extractNpmPackageRoot(pkg));
      }
      for (const localDep of comp.localDependencies) {
        const normalizedDep = normalizeLocalPath(localDep);
        if (!visitedFiles.has(normalizedDep)) {
          visitedFiles.add(normalizedDep);
          queue.push(normalizedDep);
        }
      }
    }

    // Inspect AST summary or parse AST on the fly
    let summary = astSummaries?.get(currentFile);
    const ext = path.extname(currentFile).toLowerCase();

    if (!summary && PARSABLE_EXTS.has(ext)) {
      const content = await getFileContent(currentFile);
      if (content) {
        try {
          summary = parseSourceFileAst(currentFile, content);
        } catch {
          // Ignore parse errors
        }
      }
    }

    if (summary) {
      for (const imp of summary.imports) {
        if (activeResolver) {
          const resolved = activeResolver.resolve(imp.specifier, currentFile);
          if (resolved.isExternal && resolved.packageName) {
            allExternalPackages.add(
              extractNpmPackageRoot(resolved.packageName),
            );
          } else if (!resolved.isExternal && resolved.resolvedPath) {
            const normalizedPath = normalizeLocalPath(resolved.resolvedPath);
            if (!visitedFiles.has(normalizedPath)) {
              visitedFiles.add(normalizedPath);
              queue.push(normalizedPath);
            }
          }
        } else {
          if (!imp.specifier.startsWith(".")) {
            allExternalPackages.add(extractNpmPackageRoot(imp.specifier));
          }
        }
      }
    }
  }

  // 2. Load file contents and build ComponentBundleFile entries
  const bundleFiles: ComponentBundleFile[] = [];
  let totalLinesOfCode = 0;
  let totalSizeBytes = 0;
  let hasStyles = false;

  for (const filePath of Array.from(visitedFiles)) {
    const content = await getFileContent(filePath);

    const lines = content ? content.split("\n").length : 0;
    const bytes = content ? Buffer.byteLength(content, "utf-8") : 0;
    const isMain = filePath === rootFilePath;
    const isComp = components.some((c) => c.filePath === filePath);
    const fileType = classifyFileType(filePath, isComp);

    if (fileType === "style") {
      hasStyles = true;
    }

    totalLinesOfCode += lines;
    totalSizeBytes += bytes;

    bundleFiles.push({
      filePath,
      fileName: path.basename(filePath),
      relativePath: filePath.replace(/^[/\\]+/, ""),
      content,
      isMainComponent: isMain,
      fileType,
      linesOfCode: lines,
      sizeBytes: bytes,
    });
  }

  // Sort files so main component is first, followed by child components, then utilities, etc.
  bundleFiles.sort((a, b) => {
    if (a.isMainComponent) return -1;
    if (b.isMainComponent) return 1;
    if (a.fileType === "component" && b.fileType !== "component") return -1;
    if (a.fileType !== "component" && b.fileType === "component") return 1;
    return a.filePath.localeCompare(b.filePath);
  });

  // 3. Format package dependency requirements
  const externalPackages: PackageDependencyRequirement[] = Array.from(
    allExternalPackages,
  )
    .filter(
      (pkg) =>
        pkg &&
        !pkg.startsWith("node:") &&
        pkg !== "react" &&
        pkg !== "react-dom",
    )
    .sort()
    .map((name) => {
      const version = packageDependencies[name];
      return {
        name,
        version: version || undefined,
        isDev: false,
      };
    });

  // 4. Generate install commands
  const packageSpecifiers = externalPackages
    .map((p) =>
      p.version ? `${p.name}@${p.version.replace(/^[~^]/, "")}` : p.name,
    )
    .join(" ");

  const installCommands = {
    npm: packageSpecifiers
      ? `npm install ${packageSpecifiers}`
      : "# No external dependencies required",
    pnpm: packageSpecifiers
      ? `pnpm add ${packageSpecifiers}`
      : "# No external dependencies required",
    yarn: packageSpecifiers
      ? `yarn add ${packageSpecifiers}`
      : "# No external dependencies required",
    bun: packageSpecifiers
      ? `bun add ${packageSpecifiers}`
      : "# No external dependencies required",
  };

  return {
    componentId: targetComponent.id,
    componentName: targetComponent.name,
    rootFilePath: targetComponent.filePath,
    files: bundleFiles,
    externalPackages,
    installCommands,
    summary: {
      totalFiles: bundleFiles.length,
      totalLinesOfCode,
      totalSizeBytes,
      hasStyles,
    },
  };
}

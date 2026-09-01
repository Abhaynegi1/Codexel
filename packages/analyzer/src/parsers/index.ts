import type { DependencyGraph, FileMetadata } from "@codexel/shared";
import { scanFileSystem } from "../scanner/index";
import { parseAllSourceFiles } from "./ast-walker";
import { createAliasResolver, type AliasResolver } from "./alias-resolver";
import { buildDependencyGraph } from "./graph-builder";

export * from "./ast-walker";
export * from "./alias-resolver";
export * from "./graph-builder";


/**
 * Deterministically parses JavaScript/TypeScript files, resolves module path aliases,
 * and constructs the repository-wide module Dependency Graph.
 */
export async function parseAstAndDependencies(
  workspacePath: string,
  scannedFiles?: FileMetadata[],
): Promise<DependencyGraph> {
  const files =
    scannedFiles ?? (await scanFileSystem({ workspacePath })).files;

  const resolver = await createAliasResolver(workspacePath, files);
  const astSummaries = await parseAllSourceFiles(workspacePath, files);

  return buildDependencyGraph(files, astSummaries, resolver);
}

import type { ComponentInventory, FileMetadata } from "@codexel/shared";
import { ComponentInventorySchema } from "@codexel/shared";
import { scanFileSystem } from "../scanner/index";
import {
  parseAllSourceFiles,
  type FileAstSummary,
} from "../parsers/ast-walker";
import {
  createAliasResolver,
  type AliasResolver,
} from "../parsers/alias-resolver";
import {
  detectComponentsInFile,
  type RawDetectedComponent,
} from "./component-detector";
import { buildComponentInventory } from "./usage-tracker";

export * from "./props-extractor";
export * from "./component-detector";
export * from "./usage-tracker";
export * from "./closure-resolver";

/**
 * Deterministically scans source files, discovers React components, extracts props interfaces,
 * and maps component hierarchies and usage footprints.
 */
export async function extractComponentInventory(
  workspacePath: string,
  scannedFiles?: FileMetadata[],
  preParsedSummaries?: Map<string, FileAstSummary>,
  preCreatedResolver?: AliasResolver,
): Promise<ComponentInventory> {
  const files = scannedFiles ?? (await scanFileSystem({ workspacePath })).files;

  const resolver =
    preCreatedResolver ?? (await createAliasResolver(workspacePath, files));

  const astSummaries =
    preParsedSummaries ?? (await parseAllSourceFiles(workspacePath, files));

  const rawComponentsByFile = new Map<string, RawDetectedComponent[]>();

  for (const [filePath, summary] of astSummaries.entries()) {
    const defaultExport = summary.exports.find((e) => e.isDefault);
    const detected = detectComponentsInFile(
      filePath,
      summary.sourceFile,
      defaultExport?.name,
    );
    if (detected.length > 0) {
      rawComponentsByFile.set(filePath, detected);
    }
  }

  const components = buildComponentInventory(
    rawComponentsByFile,
    astSummaries,
    resolver,
  );

  const inventory: ComponentInventory = {
    totalComponents: components.length,
    components,
  };

  return ComponentInventorySchema.parse(inventory);
}

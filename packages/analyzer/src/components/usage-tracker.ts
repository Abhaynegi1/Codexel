import type { DiscoveredComponent } from "@codexel/shared";
import type { RawDetectedComponent } from "./component-detector";
import type { FileAstSummary } from "../parsers/ast-walker";
import type { AliasResolver } from "../parsers/alias-resolver";

/**
 * Connects detected components with usage footprints (usedBy) and local/external dependencies.
 */
export function buildComponentInventory(
  rawComponentsByFile: Map<string, RawDetectedComponent[]>,
  astSummaries: Map<string, FileAstSummary>,
  resolver: AliasResolver,
): DiscoveredComponent[] {
  const discovered: DiscoveredComponent[] = [];

  // Map of component name -> list of DiscoveredComponent IDs
  const nameToComponents = new Map<
    string,
    { id: string; filePath: string; name: string }[]
  >();

  // 1. Initial pass: build base DiscoveredComponent records
  for (const [filePath, raws] of rawComponentsByFile.entries()) {
    const summary = astSummaries.get(filePath);

    const localDeps = new Set<string>();
    const externalDeps = new Set<string>();

    if (summary) {
      for (const imp of summary.imports) {
        const resolved = resolver.resolve(imp.specifier, filePath);
        if (!resolved.isExternal && resolved.resolvedPath) {
          localDeps.add(resolved.resolvedPath);
        } else if (resolved.isExternal && resolved.packageName) {
          externalDeps.add(resolved.packageName);
        }
      }
    }

    for (const raw of raws) {
      const id = `${filePath}:${raw.name}`;

      discovered.push({
        id,
        name: raw.name,
        filePath,
        lineStart: raw.lineStart,
        lineEnd: raw.lineEnd,
        isDefaultExport: raw.isDefaultExport,
        exportName: raw.exportName || raw.name,
        category: raw.category,
        props: raw.props,
        childComponents: raw.childComponents,
        usedBy: [],
        localDependencies: Array.from(localDeps).sort(),
        externalPackageDependencies: Array.from(externalDeps).sort(),
        sourceCode: raw.sourceCode,
      });

      if (!nameToComponents.has(raw.name)) {
        nameToComponents.set(raw.name, []);
      }
      nameToComponents.get(raw.name)!.push({ id, filePath, name: raw.name });
    }
  }

  // 2. Second pass: map `usedBy`
  // A component C in file A is used by file B if:
  // - B imports file A, or
  // - B's components render C in their JSX children
  for (const comp of discovered) {
    const usedBySet = new Map<
      string,
      { filePath: string; componentName?: string }
    >();

    for (const otherComp of discovered) {
      if (otherComp.id === comp.id) continue;

      // Check if otherComp renders this component
      if (otherComp.childComponents.includes(comp.name)) {
        const key = `${otherComp.filePath}:${otherComp.name}`;
        usedBySet.set(key, {
          filePath: otherComp.filePath,
          componentName: otherComp.name,
        });
      }
    }

    // Also check AST imports from files that don't have components
    for (const [filePath, summary] of astSummaries.entries()) {
      if (filePath === comp.filePath) continue;

      for (const imp of summary.imports) {
        const resolved = resolver.resolve(imp.specifier, filePath);
        if (resolved.resolvedPath === comp.filePath) {
          if (
            imp.importedNames.includes(comp.name) ||
            imp.importedNames.includes("*") ||
            (comp.isDefaultExport && imp.importedNames.includes("default"))
          ) {
            if (!usedBySet.has(filePath)) {
              usedBySet.set(filePath, { filePath });
            }
          }
        }
      }
    }

    comp.usedBy = Array.from(usedBySet.values()).sort((a, b) =>
      a.filePath.localeCompare(b.filePath),
    );
  }

  return discovered.sort((a, b) => a.id.localeCompare(b.id));
}

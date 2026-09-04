import type { RepositoryModel } from "@codexel/shared";

/**
 * Distills a full RepositoryModel into compact, deterministic markdown facts.
 * Never outputs raw unbounded code — only verified structural facts and line citations.
 */
export function serializeModelToFacts(model: RepositoryModel): string {
  const sections: string[] = [];

  // 1. Repository Metadata
  sections.push(`### Repository Overview
- Name: ${model.metadata.owner}/${model.metadata.name}
- Default Branch: ${model.metadata.defaultBranch}
- Analyzed Commit: ${model.metadata.commitSha}
- Total Source Files: ${model.fileSystem.totalFiles}
- Total Lines of Code: ${model.fileSystem.totalLinesOfCode}
- Ignored Files/Dirs: ${model.fileSystem.ignoredCount}`);

  // 2. Technology Stack & Packages
  const frameworks = model.technologyStack.frameworks
    .map(
      (f) => `${f.name} (${f.version || "detected"}) [${f.evidence.filePath}]`,
    )
    .join(", ");
  const styling = model.technologyStack.styling
    .map(
      (s) => `${s.name} (${s.version || "detected"}) [${s.evidence.filePath}]`,
    )
    .join(", ");
  const uiLibs = model.technologyStack.uiLibraries
    .map(
      (u) => `${u.name} (${u.version || "detected"}) [${u.evidence.filePath}]`,
    )
    .join(", ");
  const stateMgmt = model.technologyStack.stateManagement
    .map(
      (s) => `${s.name} (${s.version || "detected"}) [${s.evidence.filePath}]`,
    )
    .join(", ");
  const databases = model.technologyStack.database
    .map(
      (d) => `${d.name} (${d.version || "detected"}) [${d.evidence.filePath}]`,
    )
    .join(", ");

  sections.push(`### Technology Stack
- Primary Language: ${model.technologyStack.primaryLanguage}
- Frameworks: ${frameworks || "None detected"}
- Styling: ${styling || "None detected"}
- UI Libraries: ${uiLibs || "None detected"}
- State Management: ${stateMgmt || "None detected"}
- Database/ORM: ${databases || "None detected"}`);

  // 3. Architecture Layers & Boundaries
  const layersList = model.architecture.layers
    .map(
      (layer) =>
        `- Layer [${layer.id}] "${layer.name}" (Role: ${layer.role}, Files: ${layer.fileCount}):\n` +
        `  Directories: ${layer.directoryPaths.join(", ") || "Root"}\n` +
        `  Evidence: ${layer.evidence}`,
    )
    .join("\n");

  const boundaryList = model.architecture.boundaries
    .map(
      (b) =>
        `- Boundary: ${b.sourceLayerId} -> ${b.targetLayerId} (${b.importCount} imports, ${b.isAllowedByConvention ? "Allowed" : "Warning"})`,
    )
    .join("\n");

  sections.push(`### Architecture Layers & Boundaries
${layersList || "No specific architecture layers detected."}

Boundaries:
${boundaryList || "No cross-layer boundaries detected."}`);

  // 4. Component Inventory
  const componentsList = model.components.components
    .map((comp) => {
      const propTypes = comp.props
        .map((p) => `${p.name}${p.isRequired ? "" : "?"}: ${p.type}`)
        .join(", ");
      const externalDeps = comp.externalPackageDependencies.join(", ");
      const localDeps = comp.localDependencies.join(", ");
      const usedIn = comp.usedBy.map((u) => u.filePath).join(", ");

      return (
        `- Component: "${comp.name}" [${comp.filePath}:${comp.lineStart}-${comp.lineEnd}]\n` +
        `  Category: ${comp.category}\n` +
        `  Props: ${propTypes ? `(${propTypes})` : "none"}\n` +
        `  Local Imports: ${localDeps || "none"}\n` +
        `  External Packages: ${externalDeps || "none"}\n` +
        `  Child Components: ${comp.childComponents.join(", ") || "none"}\n` +
        `  Referenced By: ${usedIn || "Root / Entry point"}`
      );
    })
    .join("\n\n");

  sections.push(`### Component Inventory (${model.components.totalComponents} total components)
${componentsList || "No React components discovered."}`);

  // 5. Routes & Endpoints
  const routesList = model.routes.routes
    .map(
      (r) =>
        `- Route "${r.routePath}" (${r.kind}) in [${r.filePath}]${r.httpMethods?.length ? ` Methods: [${r.httpMethods.join(", ")}]` : ""}`,
    )
    .join("\n");

  sections.push(`### Route Inventory (Router: ${model.routes.routerType})
${routesList || "No standard routes detected."}`);

  // 6. Design System & Tokens
  const colorsList = model.designSystem.colorPalette
    .slice(0, 15)
    .map((c) => `${c.name}: ${c.value} (from ${c.source})`)
    .join(", ");

  const topTailwind = model.designSystem.topTailwindClasses
    .slice(0, 15)
    .map((t) => `${t.className} (${t.count}x)`)
    .join(", ");

  sections.push(`### Design System & Tokens
- UI Primitive Library: ${model.designSystem.libraries.uiPrimitiveLibrary || "Custom"}
- Icon Library: ${model.designSystem.libraries.iconLibrary || "None"}
- Animation Library: ${model.designSystem.libraries.animationLibrary || "None"}
- Typography Fonts: ${model.designSystem.typography.fontFamilies.join(", ") || "System Default"}
- Font Weights: ${model.designSystem.typography.fontWeights.join(", ") || "Standard"}
- Palette Sample: ${colorsList || "Default tokens"}
- Top Utility Classes: ${topTailwind || "None"}`);

  return sections.join("\n\n");
}

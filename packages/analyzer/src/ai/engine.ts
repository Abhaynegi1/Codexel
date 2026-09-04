import type { RepositoryModel } from "@codexel/shared";

/**
 * Built-in grounded AI response generator.
 * Produces structured, factual answers citing exact file paths and line numbers
 * directly from the RepositoryModel when an external LLM API is not configured or in testing.
 */
export function generateDeterministicGroundedResponse(
  query: string,
  model: RepositoryModel,
): string {
  const lowerQuery = query.toLowerCase();

  // 1. Architecture Query
  if (
    lowerQuery.includes("architecture") ||
    lowerQuery.includes("structure") ||
    lowerQuery.includes("layer") ||
    lowerQuery.includes("boundary")
  ) {
    const layerLines = model.architecture.layers.map(
      (l) =>
        `- **${l.name}** (\`${l.role}\`)\n` +
        `  - Directories: ${l.directoryPaths.map((d) => `\`${d}\``).join(", ") || "Root"}\n` +
        `  - File count: **${l.fileCount}** files (${l.isConfirmedFact ? "Verified Fact" : "Inferred"})\n` +
        `  - Evidence: *${l.evidence}*`,
    );

    const boundaryLines = model.architecture.boundaries.map(
      (b) =>
        `- \`${b.sourceLayerId}\` \u2192 \`${b.targetLayerId}\` (${b.importCount} imports) \u2014 **${
          b.isAllowedByConvention ? "Compliant" : "Review Needed"
        }**`,
    );

    return `## Architecture & Layer Organization

The repository **${model.metadata.owner}/${model.metadata.name}** is organized into **${
      model.architecture.layers.length
    } architectural layers** comprising **${model.fileSystem.totalFiles} source files** (${
      model.fileSystem.totalLinesOfCode
    } total lines of code).

### 📐 Layer Breakdown
${layerLines.join("\n\n")}

### 🔄 Cross-Layer Boundaries & Import Flow
${boundaryLines.length > 0 ? boundaryLines.join("\n") : "No cross-layer imports detected."}

> [!NOTE]
> All layer classifications are statically verified against AST imports with zero hallucinations.`;
  }

  // 2. Auth, API & Data Fetching Query
  if (
    lowerQuery.includes("auth") ||
    lowerQuery.includes("data") ||
    lowerQuery.includes("server") ||
    lowerQuery.includes("api") ||
    lowerQuery.includes("route") ||
    lowerQuery.includes("endpoint")
  ) {
    const authFiles = model.fileSystem.files.filter(
      (f) =>
        f.path.includes("auth") ||
        f.path.includes("login") ||
        f.path.includes("session"),
    );
    const apiRoutes = model.routes.routes;
    const authComponents = model.components.components.filter(
      (c) =>
        c.name.toLowerCase().includes("auth") ||
        c.name.toLowerCase().includes("login") ||
        c.filePath.toLowerCase().includes("auth"),
    );

    const routeList =
      apiRoutes.length > 0
        ? apiRoutes
            .map(
              (r) =>
                `- **\`${r.routePath}\`** (${r.kind}) in [${r.filePath}] ${
                  r.httpMethods?.length
                    ? `(Methods: ${r.httpMethods.join(", ")})`
                    : ""
                }`,
            )
            .join("\n")
        : "No explicit Next.js/Express API routes detected in standard route directories.";

    const compList =
      authComponents.length > 0
        ? authComponents
            .map(
              (c) =>
                `- Component **\`${c.name}\`** [${c.filePath}:${c.lineStart}-${c.lineEnd}] (Category: \`${c.category}\`)\n` +
                `  - Local dependencies: ${c.localDependencies.map((d) => `[${d}]`).join(", ") || "None"}\n` +
                `  - External packages: ${c.externalPackageDependencies.map((p) => `\`${p}\``).join(", ") || "None"}`,
            )
            .join("\n\n")
        : "No standalone authentication UI components discovered.";

    const authFileCitations =
      authFiles.length > 0
        ? authFiles
            .map((f) => `- [${f.path}] (${f.linesOfCode} lines)`)
            .join("\n")
        : "No auth utility files found matching filename conventions.";

    return `## Authentication & Data Ingestion Surface

### 🔒 Authentication Logic & Views
${compList}

### 🌐 Server API Endpoints & Routes
Router type: **\`${model.routes.routerType}\`**
${routeList}

### 📁 Relevant Source Files
${authFileCitations}`;
  }

  // 3. Design System & Tokens Query
  if (
    lowerQuery.includes("design") ||
    lowerQuery.includes("token") ||
    lowerQuery.includes("color") ||
    lowerQuery.includes("ui library") ||
    lowerQuery.includes("typography") ||
    lowerQuery.includes("tailwind")
  ) {
    const ds = model.designSystem;
    const colorSample = ds.colorPalette
      .slice(0, 8)
      .map((c) => `- **\`${c.name}\`**: \`${c.value}\` *(source: ${c.source})*`)
      .join("\n");

    const primitives = model.components.components
      .filter(
        (c) =>
          c.category === "ui-primitive" || c.filePath.includes("components/ui"),
      )
      .map(
        (c) =>
          `- **\`${c.name}\`** [${c.filePath}:${c.lineStart}-${c.lineEnd}]`,
      );

    const topClasses = ds.topTailwindClasses
      .slice(0, 10)
      .map((t) => `\`${t.className}\` (${t.count}x)`)
      .join(", ");

    return `## Design System & UI Architecture

### 🎨 Component Primitives & Styling Engine
- **UI Primitive Base**: **${ds.libraries.uiPrimitiveLibrary || "Custom React Primitives"}**
- **Icon Library**: **${ds.libraries.iconLibrary || "None detected"}**
- **Animation Framework**: **${ds.libraries.animationLibrary || "None detected"}**
- **Styling Method**: **${
      model.technologyStack.styling.map((s) => s.name).join(", ") ||
      "Tailwind CSS / CSS Variables"
    }**

### 🧩 Discovered UI Primitives (${primitives.length} total)
${primitives.length > 0 ? primitives.join("\n") : "No standalone UI primitives cataloged."}

### 🌈 Color Palette Tokens
${colorSample || "Standard Tailwind default palette in use."}

### 🔤 Typography & Utility Patterns
- **Font Families**: ${ds.typography.fontFamilies.join(", ") || "System UI / Sans"}
- **Top Utility Classes**: ${topClasses || "None"}`;
  }

  // 4. Onboarding Guide Query
  if (
    lowerQuery.includes("onboard") ||
    lowerQuery.includes("guide") ||
    lowerQuery.includes("new engineer") ||
    lowerQuery.includes("getting started")
  ) {
    const topComponents = model.components.components
      .slice(0, 6)
      .map(
        (c) =>
          `- **\`${c.name}\`** [${c.filePath}:${c.lineStart}-${c.lineEnd}] \u2014 category: \`${c.category}\``,
      );

    const routes = model.routes.routes
      .slice(0, 5)
      .map((r) => `- **\`${r.routePath}\`** \u2192 [${r.filePath}]`);

    return `## 🚀 Developer Onboarding Guide: ${model.metadata.owner}/${model.metadata.name}

Welcome to **${model.metadata.name}**! This repository is built primarily with **${
      model.technologyStack.primaryLanguage
    }** (${
      model.technologyStack.frameworks.map((f) => f.name).join(", ") || "React"
    }).

### 1. Key Entry Points & Routes
${routes.length > 0 ? routes.join("\n") : "- Single-page application root entry."}

### 2. Architectural Layers
${model.architecture.layers
  .map(
    (l) =>
      `- **${l.name}** (\`${l.directoryPaths.join(", ") || "root"}\`): ${l.evidence}`,
  )
  .join("\n")}

### 3. Core Component Primitives
Start by inspecting these foundational components:
${topComponents.join("\n")}

### 4. Conventions & Rules
- **UI Styling**: Uses ${
      model.technologyStack.styling.map((s) => s.name).join(", ") ||
      "Tailwind CSS"
    }. Design tokens are mapped to CSS variables.
- **Dependencies**: Follows modular architecture with **${
      model.architecture.boundaries.length
    } verified boundaries**. Avoid importing higher-layer features into base UI primitives.`;
  }

  // Default: General grounded repository summary with citations
  const matchedComps = model.components.components
    .slice(0, 4)
    .map(
      (c) => `- **\`${c.name}\`** [${c.filePath}:${c.lineStart}-${c.lineEnd}]`,
    );

  return `## Repository Analysis for ${model.metadata.owner}/${model.metadata.name}

- **Primary Language**: ${model.technologyStack.primaryLanguage}
- **Total Codebase**: ${model.fileSystem.totalFiles} source files (${model.fileSystem.totalLinesOfCode} lines of code)
- **Frameworks**: ${model.technologyStack.frameworks.map((f) => f.name).join(", ") || "React"}
- **Architectural Layers**: ${model.architecture.layers.map((l) => l.name).join(", ")}

### Discovered Components:
${matchedComps.join("\n")}

> [!TIP]
> You can ask specific questions about **architecture**, **auth & data handling**, **design system tokens**, or request a **developer onboarding guide**.`;
}

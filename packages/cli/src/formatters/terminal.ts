import pc from "picocolors";
import type { RepositoryModel } from "@codexel/shared";

export function formatTerminalSummary(
  model: RepositoryModel,
  targetPath: string,
): string {
  const lines: string[] = [];

  const divider = pc.dim("─".repeat(64));
  const doubleDivider = pc.cyan("═".repeat(64));

  // Header Banner
  lines.push("");
  lines.push(
    pc.bold(
      pc.cyan(
        "  ╔═══════════════════════════════════════════════════════════╗",
      ),
    ),
  );
  lines.push(
    pc.bold(
      pc.cyan("  ║") +
        pc.bold(
          pc.white(
            "   ⚡ CODEXEL — Codebase Intelligence & Architecture Engine  ",
          ),
        ) +
        pc.cyan("║"),
    ),
  );
  lines.push(
    pc.bold(
      pc.cyan(
        "  ╚═══════════════════════════════════════════════════════════╝",
      ),
    ),
  );
  lines.push("");

  // Target & Metadata
  lines.push(
    `  ${pc.bold("Project:")}     ${pc.green(pc.bold(model.metadata?.name || "project"))}`,
  );
  lines.push(`  ${pc.bold("Location:")}    ${pc.dim(targetPath)}`);
  lines.push(
    `  ${pc.bold("Timestamp:")}   ${pc.dim(model.metadata?.analyzedAt || new Date().toISOString())}`,
  );
  lines.push(divider);

  // 1. Filesystem & Metrics Overview
  const totalFiles =
    model.fileSystem?.totalFiles ?? model.fileSystem?.files?.length ?? 0;
  const totalLoc = (model.fileSystem?.totalLinesOfCode ?? 0).toLocaleString();
  const languages = (model.technologyStack?.languages || [])
    .slice(0, 5)
    .map((l) => `${l.name} (${l.percentage}%)`)
    .join(", ");

  lines.push(pc.bold(pc.yellow("  📊 FILESYSTEM & REPOSITORY METRICS")));
  lines.push(
    `    • Files Analyzed:  ${pc.white(pc.bold(String(totalFiles)))} files`,
  );
  lines.push(
    `    • Total Code:      ${pc.white(pc.bold(totalLoc))} lines of code`,
  );
  if (languages) {
    lines.push(`    • Languages:       ${pc.dim(languages)}`);
  }
  lines.push(divider);

  // 2. Technology Stack
  const tech = model.technologyStack || ({} as any);
  const frameworks = (tech.frameworks || []).map((f: any) => f.name).join(", ");
  const styling = (tech.styling || []).map((s: any) => s.name).join(", ");
  const uiLibs = (tech.uiLibraries || []).map((u: any) => u.name).join(", ");
  const db = (tech.database || []).map((d: any) => d.name).join(", ");
  const stateMgmt = (tech.stateManagement || [])
    .map((st: any) => st.name)
    .join(", ");

  lines.push(pc.bold(pc.magenta("  🛠️  TECHNOLOGY STACK")));
  lines.push(
    `    • Frameworks:      ${frameworks ? pc.green(pc.bold(frameworks)) : pc.dim("None / Vanilla")}`,
  );
  lines.push(
    `    • Primary Lang:    ${tech.primaryLanguage ? pc.blue(tech.primaryLanguage) : pc.dim("TypeScript")}`,
  );
  lines.push(
    `    • Styling:         ${styling ? pc.cyan(styling) : pc.dim("Standard CSS")}`,
  );
  lines.push(
    `    • UI Libraries:    ${uiLibs ? pc.magenta(uiLibs) : pc.dim("None detected")}`,
  );
  lines.push(
    `    • Database / ORM:  ${db ? pc.yellow(db) : pc.dim("None detected")}`,
  );
  lines.push(
    `    • State Mgmt:      ${stateMgmt ? pc.blue(stateMgmt) : pc.dim("None detected")}`,
  );
  lines.push(divider);

  // 3. Architecture & Routes
  const arch = model.architecture || ({} as any);
  const routesList = model.routes?.routes || [];
  const routesCount = routesList.length;
  const routerType = model.routes?.routerType || "none";

  lines.push(pc.bold(pc.blue("  🏛️  ARCHITECTURE & ROUTES")));
  lines.push(`    • Router Type:     ${pc.bold(pc.white(routerType))}`);
  lines.push(
    `    • Total Routes:    ${pc.green(pc.bold(String(routesCount)))} endpoints/pages detected`,
  );

  if (routesList.length > 0) {
    const sampleRoutes = routesList.slice(0, 5);
    lines.push(`    • Route Samples:`);
    for (const route of sampleRoutes) {
      lines.push(
        `      ${pc.dim("→")} ${pc.cyan(route.routePath)} ${pc.dim(`(${route.kind})`)}`,
      );
    }
    if (routesList.length > 5) {
      lines.push(
        `      ${pc.dim(`... and ${routesList.length - 5} more routes`)}`,
      );
    }
  }

  if (arch.layers && arch.layers.length > 0) {
    lines.push(`    • Architecture Layers:`);
    for (const layer of arch.layers) {
      lines.push(
        `      • ${pc.bold(layer.name)}: ${pc.dim(`${layer.fileCount} files`)} - ${pc.dim(layer.role)}`,
      );
    }
  }
  lines.push(divider);

  // 4. Component Inventory
  const compList = model.components?.components || [];
  const totalComponents = model.components?.totalComponents ?? compList.length;
  lines.push(pc.bold(pc.green("  🧩 COMPONENT INVENTORY")));
  lines.push(
    `    • Total Components: ${pc.white(pc.bold(String(totalComponents)))}`,
  );

  if (compList.length > 0) {
    const categories: Record<string, number> = {};
    for (const comp of compList) {
      const cat = comp.category || "ui-primitive";
      categories[cat] = (categories[cat] || 0) + 1;
    }
    const catSummary = Object.entries(categories)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(" | ");
    lines.push(`    • Categories:       ${pc.dim(catSummary)}`);

    const topComponents = [...compList]
      .sort((a, b) => (b.usedBy?.length || 0) - (a.usedBy?.length || 0))
      .slice(0, 6);

    lines.push(`    • Key Components:`);
    for (const comp of topComponents) {
      const usage = comp.usedBy?.length || 0;
      const propsCount = comp.props?.length || 0;
      lines.push(
        `      ${pc.green("✔")} ${pc.bold(comp.name)} ${pc.dim(`(${comp.filePath})`)} - ${pc.cyan(`${propsCount} props`)} - ${pc.yellow(`used by ${usage}`)}`,
      );
    }
    if (compList.length > 6) {
      lines.push(
        `      ${pc.dim(`... and ${compList.length - 6} more components`)}`,
      );
    }
  }
  lines.push(divider);

  // 5. Design System Intelligence
  const design = model.designSystem || ({} as any);
  const colorCount = design.colorPalette?.length || 0;
  const cssVarCount = Object.keys(design.detectedCssVariables || {}).length;
  const fontFamilies = (design.typography?.fontFamilies || []).join(", ");

  lines.push(pc.bold(pc.cyan("  🎨 DESIGN SYSTEM & TOKENS")));
  lines.push(
    `    • Color Tokens:    ${pc.white(String(colorCount))} palette colors`,
  );
  lines.push(
    `    • CSS Variables:   ${pc.white(String(cssVarCount))} detected`,
  );
  lines.push(
    `    • Font Families:   ${fontFamilies ? pc.magenta(fontFamilies) : pc.dim("Default system fonts")}`,
  );
  if (design.topTailwindClasses && design.topTailwindClasses.length > 0) {
    const topClasses = design.topTailwindClasses
      .slice(0, 8)
      .map((c: any) => c.className)
      .join(", ");
    lines.push(`    • Top Classes:     ${pc.dim(topClasses)}`);
  }
  lines.push(divider);

  // 6. Execution Timings
  const stats = model.analysisStats || ({} as any);
  const timings = stats.timings || {};
  lines.push(pc.bold(pc.white("  ⏱️  PERFORMANCE & TIMINGS")));
  lines.push(
    `    • Total Duration:  ${pc.bold(pc.green(`${stats.totalDurationMs ?? 0} ms`))}`,
  );
  lines.push(
    `    • Scan & Detect:   ${pc.dim(`${timings.scanningMs ?? 0} ms`)}`,
  );
  lines.push(
    `    • AST Parsing:     ${pc.dim(`${timings.astParsingMs ?? 0} ms`)}`,
  );
  lines.push(
    `    • Graph Building:  ${pc.dim(`${timings.graphBuildingMs ?? 0} ms`)}`,
  );
  lines.push(doubleDivider);
  lines.push("");

  return lines.join("\n");
}

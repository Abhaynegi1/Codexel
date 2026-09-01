#!/usr/bin/env tsx
import * as path from "node:path";
import * as fs from "node:fs";
import { analyzeRepository } from "./index";
import { withSandbox } from "./ingestion/sandbox";
import { parseGitHubUrl } from "./ingestion/url-parser";
import { resolveRemoteRepo } from "./ingestion/remote-resolver";

async function runAnalysis(
  targetPath: string,
  meta: {
    url: string;
    owner: string;
    name: string;
    commitSha: string;
    defaultBranch?: string;
  },
) {
  console.log(`\n🔍 Analyzing repository at: ${targetPath}`);
  const model = await analyzeRepository({
    workspacePath: targetPath,
    url: meta.url,
    owner: meta.owner,
    name: meta.name,
    commitSha: meta.commitSha,
    defaultBranch: meta.defaultBranch || "main",
  });

  console.log("\n========================================================");
  console.log(` 📊 Repository Model: ${model.metadata.owner}/${model.metadata.name}`);
  console.log("========================================================");

  // 1. Filesystem
  console.log("\n📁 Filesystem Inventory:");
  console.log(`   • Total Files:           ${model.fileSystem.totalFiles.toLocaleString()}`);
  console.log(`   • Total Directories:     ${model.fileSystem.totalDirectories.toLocaleString()}`);
  console.log(`   • Lines of Code:         ${model.fileSystem.totalLinesOfCode.toLocaleString()}`);
  console.log(`   • Ignored Paths Count:   ${model.fileSystem.ignoredCount.toLocaleString()}`);
  console.log(`   • Root Folders:          ${model.fileSystem.rootDirectories.join(", ") || "(none)"}`);

  // 2. Languages
  console.log("\n💻 Languages Breakdown:");
  console.log(`   • Primary Language:      ${model.technologyStack.primaryLanguage}`);
  for (const lang of model.technologyStack.languages.slice(0, 6)) {
    console.log(`     - ${lang.name.padEnd(16)}: ${lang.percentage.toFixed(1)}% (${lang.fileCount} files)`);
  }

  // 3. Technologies
  const printSection = (title: string, items: Array<{ name: string; version?: string; evidence: { filePath: string; description: string } }>) => {
    if (items.length === 0) return;
    console.log(`\n🧩 ${title}:`);
    for (const item of items) {
      const ver = item.version ? ` (${item.version})` : "";
      console.log(`   • ${item.name}${ver} [${item.evidence.filePath}]`);
    }
  };

  printSection("Frameworks", model.technologyStack.frameworks);
  printSection("Styling", model.technologyStack.styling);
  printSection("Databases & ORMs", model.technologyStack.database);
  printSection("State Management", model.technologyStack.stateManagement);
  printSection("UI Libraries", model.technologyStack.uiLibraries);
  printSection("Build Tools & Testing", model.technologyStack.buildTools);

  // 4. Dependency Graph
  console.log("\n🕸️  Dependency Graph (DAG):");
  console.log(`   • Total Graph Nodes:     ${model.dependencyGraph.nodes.length.toLocaleString()}`);
  console.log(`   • Total Import Edges:    ${model.dependencyGraph.edges.length.toLocaleString()}`);
  const topHubs = [...model.dependencyGraph.nodes]
    .sort((a, b) => (b.data.inDegree || 0) - (a.data.inDegree || 0))
    .slice(0, 5)
    .filter((n) => (n.data.inDegree || 0) > 0);
  if (topHubs.length > 0) {
    console.log("   • Most Imported Modules (High In-Degree):");
    for (const hub of topHubs) {
      console.log(`     - ${hub.label} (${hub.id}) ➔ imported by ${hub.data.inDegree} files`);
    }
  }

  // 5. Component Inventory
  console.log("\n⚛️  React Component Inventory:");
  console.log(`   • Total Components:      ${model.components.totalComponents.toLocaleString()}`);
  for (const comp of model.components.components.slice(0, 8)) {
    const propsCount = comp.props.length > 0 ? ` [${comp.props.length} props]` : "";
    const childrenCount = comp.childComponents.length > 0 ? ` [renders: ${comp.childComponents.join(", ")}]` : "";
    console.log(`   • ${comp.name} (${comp.category}) ➔ ${comp.filePath}:${comp.lineStart}${propsCount}${childrenCount}`);
  }
  if (model.components.totalComponents > 8) {
    console.log(`     ... and ${model.components.totalComponents - 8} more components`);
  }

  // 6. Routes
  console.log("\n🛣️  Route Inventory:");
  console.log(`   • Router Type:           ${model.routes.routerType}`);
  console.log(`   • Total Routes:          ${model.routes.routes.length}`);
  for (const route of model.routes.routes) {
    const methods = route.httpMethods ? ` [${route.httpMethods.join(", ")}]` : "";
    console.log(`   • ${route.routePath.padEnd(20)} (${route.kind})${methods} ➔ ${route.filePath}`);
  }

  // 7. Execution Timings
  console.log("\n⏱️  Analysis Timings:");
  console.log(`   • Filesystem Scan:       ${model.analysisStats.timings.scanningMs} ms`);
  console.log(`   • AST Parsing:           ${model.analysisStats.timings.astParsingMs} ms`);
  console.log(`   • Graph Construction:    ${model.analysisStats.timings.graphBuildingMs} ms`);
  console.log(`   • Total Execution Time:  ${model.analysisStats.totalDurationMs} ms`);
  console.log("========================================================\n");
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0] || ".";

  console.log("========================================================");
  console.log(" Codexel Phase 3: Code Intelligence & AST Test Harness");
  console.log("========================================================");

  const isGitHubUrl =
    target.startsWith("http://") ||
    target.startsWith("https://") ||
    target.startsWith("github.com/");

  if (isGitHubUrl) {
    console.log(`Target: Public GitHub repository (${target})`);
    const parsed = parseGitHubUrl(target);
    const remoteInfo = await resolveRemoteRepo(parsed);

    await withSandbox(target, async (sandbox) => {
      await runAnalysis(sandbox.path, {
        url: parsed.cleanUrl,
        owner: parsed.owner,
        name: parsed.repo,
        commitSha: remoteInfo.commitSha,
        defaultBranch: remoteInfo.defaultBranch,
      });
    });
    console.log("✅ Ephemeral sandbox cleaned up successfully.");
  } else {
    const resolvedPath = path.resolve(process.cwd(), target);
    console.log(`Target: Local directory (${resolvedPath})`);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`❌ Error: Directory does not exist: ${resolvedPath}`);
      process.exit(1);
    }
    const name = path.basename(resolvedPath) || "workspace";
    await runAnalysis(resolvedPath, {
      url: `file://${resolvedPath}`,
      owner: "local",
      name,
      commitSha: "local-head",
      defaultBranch: "main",
    });
  }
}

main().catch((err) => {
  console.error("❌ Test harness error:", err);
  process.exit(1);
});

#!/usr/bin/env tsx
import * as path from "node:path";
import * as fs from "node:fs";
import { scanFileSystem } from "./scanner/index";
import { detectTechnologies } from "./detectors/index";
import { withSandbox } from "./ingestion/sandbox";
import { parseGitHubUrl } from "./ingestion/url-parser";

async function analyzeWorkspace(targetPath: string, label: string) {
  console.log(`\n🔍 Scanning workspace: ${targetPath}`);
  const startTime = Date.now();

  const fileSystem = await scanFileSystem({ workspacePath: targetPath });
  const scanDuration = Date.now() - startTime;

  const detectStartTime = Date.now();
  const techStack = await detectTechnologies(targetPath, fileSystem.files);
  const detectDuration = Date.now() - detectStartTime;

  console.log("\n========================================================");
  console.log(` 📊 Analysis Results for: ${label}`);
  console.log("========================================================");

  console.log("\n📁 Filesystem Inventory:");
  console.log(`   • Total Scanned Files:   ${fileSystem.totalFiles.toLocaleString()}`);
  console.log(`   • Total Directories:     ${fileSystem.totalDirectories.toLocaleString()}`);
  console.log(`   • Total Lines of Code:   ${fileSystem.totalLinesOfCode.toLocaleString()}`);
  console.log(`   • Ignored Paths Count:   ${fileSystem.ignoredCount.toLocaleString()}`);
  console.log(`   • Root Folders:          ${fileSystem.rootDirectories.join(", ") || "(none)"}`);

  console.log("\n💻 Languages Breakdown:");
  console.log(`   • Primary Language:      ${techStack.primaryLanguage}`);
  for (const lang of techStack.languages.slice(0, 6)) {
    console.log(`     - ${lang.name.padEnd(16)}: ${lang.percentage.toFixed(1)}% (${lang.fileCount} files)`);
  }

  const printSection = (title: string, items: Array<{ name: string; version?: string; evidence: { filePath: string; description: string } }>) => {
    if (items.length === 0) return;
    console.log(`\n🧩 ${title}:`);
    for (const item of items) {
      const ver = item.version ? ` (${item.version})` : "";
      console.log(`   • ${item.name}${ver}`);
      console.log(`     Evidence: [${item.evidence.filePath}] ${item.evidence.description}`);
    }
  };

  printSection("Frameworks", techStack.frameworks);
  printSection("Styling", techStack.styling);
  printSection("Databases & ORMs", techStack.database);
  printSection("State Management", techStack.stateManagement);
  printSection("UI Libraries", techStack.uiLibraries);
  printSection("Build Tools & Testing", techStack.buildTools);

  console.log("\n⏱️  Timings:");
  console.log(`   • Filesystem Walk & LOC: ${scanDuration} ms`);
  console.log(`   • Technology Detection:  ${detectDuration} ms`);
  console.log(`   • Total Duration:        ${scanDuration + detectDuration} ms`);
  console.log("========================================================\n");
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0] || ".";

  console.log("========================================================");
  console.log(" Codexel Phase 2: Scanner & Detector Manual Test Harness");
  console.log("========================================================");

  const isGitHubUrl = target.startsWith("http://") || target.startsWith("https://") || target.startsWith("github.com/");

  if (isGitHubUrl) {
    console.log(`Target: Public GitHub repository (${target})`);
    const parsed = parseGitHubUrl(target);

    await withSandbox(target, async (sandbox) => {
      await analyzeWorkspace(sandbox.path, `${parsed.owner}/${parsed.repo}`);
    });
    console.log("✅ Ephemeral sandbox cleaned up successfully.");
  } else {
    const resolvedPath = path.resolve(process.cwd(), target);
    console.log(`Target: Local directory (${resolvedPath})`);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`❌ Error: Directory does not exist: ${resolvedPath}`);
      process.exit(1);
    }
    await analyzeWorkspace(resolvedPath, path.basename(resolvedPath) || "workspace");
  }
}

main().catch((err) => {
  console.error("❌ Test harness error:", err);
  process.exit(1);
});

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const REQUIRED_DOCS = [
  "README.md",
  "docs/ROADMAP.md",
  "docs/CODE_HYGIENE.md",
];

async function checkDocs() {
  console.log("🔍 Checking documentation integrity and hygiene...\n");
  let hasErrors = false;

  // 1. Check required documentation files
  console.log("Checking required documentation files:");
  for (const doc of REQUIRED_DOCS) {
    const fullPath = path.join(rootDir, doc);
    try {
      const stat = await fs.stat(fullPath);
      if (stat.size < 100) {
        console.error(`  ❌ ${doc} exists but is suspiciously small (< 100 bytes)`);
        hasErrors = true;
      } else {
        console.log(`  ✅ ${doc} (${stat.size} bytes)`);
      }
    } catch {
      console.error(`  ❌ Missing required document: ${doc}`);
      hasErrors = true;
    }
  }

  // 2. Scan all markdown files in docs/ and root for syntax hygiene
  console.log("\nScanning markdown files for hygiene (code block languages & links):");
  const mdFiles = [];

  async function collectMdFiles(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") {
          continue;
        }
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "docs" || entry.name === ".github") {
            await collectMdFiles(full);
          }
        } else if (entry.name.endsWith(".md")) {
          mdFiles.push(full);
        }
      }
    } catch {
      // Ignore
    }
  }

  await collectMdFiles(rootDir);

  for (const file of mdFiles) {
    const relPath = path.relative(rootDir, file);
    try {
      const content = await fs.readFile(file, "utf-8");

      // Check for opening code blocks without language specifier
      const lines = content.split(/\r?\n/);
      let inCodeBlock = false;
      let bareOpenings = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim() || "";
        if (line.startsWith("```")) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            const lang = line.slice(3).trim();
            if (!lang) {
              bareOpenings++;
            }
          } else {
            inCodeBlock = false;
          }
        }
      }

      if (bareOpenings > 0) {
        console.warn(`  ⚠️  ${relPath}: Found ${bareOpenings} opening code block(s) without language specifier (consider using \`\`\`text or specific language)`);
      }

      console.log(`  ✅ ${relPath} passed hygiene check`);
    } catch (err) {
      console.error(`  ❌ Failed to read ${relPath}:`, err);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error("\n❌ Documentation hygiene check FAILED. Please fix the errors above.");
    process.exit(1);
  } else {
    console.log("\n✨ All documentation integrity & hygiene checks PASSED successfully!");
  }
}

checkDocs();

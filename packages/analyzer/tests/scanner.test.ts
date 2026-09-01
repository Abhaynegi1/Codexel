import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  scanFileSystem,
  createIgnoreEngine,
  classifyFile,
  countLinesOfCode,
} from "../src/scanner/index";
import { FileSystemSummarySchema } from "@codexel/shared";

describe("Filesystem Scanner & Ignore Engine", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codexel-scanner-test-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignored
    }
  });

  it("classifies source, config, and language correctly", () => {
    expect(classifyFile("src/index.ts")).toEqual({
      extension: ".ts",
      isSource: true,
      isConfig: false,
      language: "TypeScript",
    });

    expect(classifyFile("components/Button.tsx")).toEqual({
      extension: ".tsx",
      isSource: true,
      isConfig: false,
      language: "TypeScript",
    });

    expect(classifyFile("package.json")).toEqual({
      extension: ".json",
      isSource: false,
      isConfig: true,
      language: "JSON",
    });

    expect(classifyFile("tailwind.config.ts")).toEqual({
      extension: ".ts",
      isSource: true,
      isConfig: true,
      language: "TypeScript",
    });
  });

  it("accurately counts lines of code", async () => {
    const filePath = path.join(tempDir, "sample.ts");
    await fs.writeFile(filePath, "const a = 1;\nconst b = 2;\nconst c = 3;\n");
    expect(await countLinesOfCode(filePath)).toBe(3);

    const noTrailingNewline = path.join(tempDir, "notrail.ts");
    await fs.writeFile(noTrailingNewline, "line 1\nline 2");
    expect(await countLinesOfCode(noTrailingNewline)).toBe(2);

    const emptyFile = path.join(tempDir, "empty.ts");
    await fs.writeFile(emptyFile, "");
    expect(await countLinesOfCode(emptyFile)).toBe(0);
  });

  it("recursively scans directory and early-prunes default ignored directories", async () => {
    // Create directory tree
    await fs.mkdir(path.join(tempDir, "src"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "node_modules", "some-pkg"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "dist"), { recursive: true });
    await fs.mkdir(path.join(tempDir, ".git"), { recursive: true });

    await fs.writeFile(path.join(tempDir, "src", "index.ts"), "export const a = 1;\n");
    await fs.writeFile(path.join(tempDir, "src", "App.tsx"), "export default function App() {}\n");
    await fs.writeFile(path.join(tempDir, "package.json"), '{"name": "test-pkg"}\n');
    await fs.writeFile(path.join(tempDir, "node_modules", "some-pkg", "index.js"), "module.exports = {};\n");
    await fs.writeFile(path.join(tempDir, "dist", "bundle.js"), "console.log(1);\n");

    const summary = await scanFileSystem({ workspacePath: tempDir });

    // Validate schema
    expect(() => FileSystemSummarySchema.parse(summary)).not.toThrow();

    // Check files
    const paths = summary.files.map((f) => f.path);
    expect(paths).toContain("src/index.ts");
    expect(paths).toContain("src/App.tsx");
    expect(paths).toContain("package.json");

    // Ignored directories must not be in file list
    expect(paths.some((p) => p.includes("node_modules"))).toBe(false);
    expect(paths.some((p) => p.includes("dist"))).toBe(false);

    // rootDirectories check
    expect(summary.rootDirectories).toContain("src");
    expect(summary.rootDirectories).not.toContain("node_modules");
    expect(summary.rootDirectories).not.toContain("dist");

    // Ignored count should be non-zero
    expect(summary.ignoredCount).toBeGreaterThan(0);
    expect(summary.totalFiles).toBe(3);
  });

  it("respects repository .gitignore file and custom ignore patterns", async () => {
    await fs.mkdir(path.join(tempDir, "logs"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "secret"), { recursive: true });

    await fs.writeFile(path.join(tempDir, ".gitignore"), "logs/\n*.secret\n");
    await fs.writeFile(path.join(tempDir, "logs", "app.log"), "log line 1\n");
    await fs.writeFile(path.join(tempDir, "key.secret"), "supersecret\n");
    await fs.writeFile(path.join(tempDir, "secret", "data.txt"), "private\n");
    await fs.writeFile(path.join(tempDir, "valid.ts"), "const x = 10;\n");

    const summary = await scanFileSystem({
      workspacePath: tempDir,
      customIgnores: ["secret/"],
    });

    const paths = summary.files.map((f) => f.path);
    expect(paths).toContain("valid.ts");
    expect(paths).not.toContain("logs/app.log");
    expect(paths).not.toContain("key.secret");
    expect(paths).not.toContain("secret/data.txt");
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  detectTechnologies,
  parseWorkspaceManifests,
  calculateLanguageStats,
  evaluateTechnologyRules,
} from "../src/detectors/index";
import { scanFileSystem } from "../src/scanner/index";
import { TechnologyStackSchema } from "@codexel/shared";

describe("Technology & Manifest Detectors", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "codexel-detector-test-"),
    );
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignored
    }
  });

  it("calculates language distribution and identifies primary language", () => {
    const mockFiles = [
      {
        path: "src/index.ts",
        extension: ".ts",
        sizeBytes: 100,
        linesOfCode: 10,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/App.tsx",
        extension: ".tsx",
        sizeBytes: 200,
        linesOfCode: 20,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/style.css",
        extension: ".css",
        sizeBytes: 50,
        linesOfCode: 5,
        isSource: true,
        isConfig: false,
      },
      {
        path: "README.md",
        extension: ".md",
        sizeBytes: 80,
        linesOfCode: 8,
        isSource: false,
        isConfig: false,
      },
    ];

    const stats = calculateLanguageStats(mockFiles);
    expect(stats.primaryLanguage).toBe("TypeScript");
    expect(stats.languages).toHaveLength(3); // TypeScript (2), CSS (1), Markdown (1)

    const tsLang = stats.languages.find((l) => l.name === "TypeScript");
    expect(tsLang?.fileCount).toBe(2);
    expect(tsLang?.percentage).toBe(50);
  });

  it("detects frameworks, styling, database, UI libraries, and tooling from a Next.js fullstack fixture", async () => {
    // Scaffold fixture workspace
    await fs.mkdir(path.join(tempDir, "src", "app"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "src", "components"), {
      recursive: true,
    });

    // package.json with dependencies
    const packageJsonContent = {
      name: "my-next-app",
      version: "0.1.0",
      dependencies: {
        next: "15.1.0",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "drizzle-orm": "^0.38.0",
        "lucide-react": "^0.470.0",
        "@radix-ui/react-dialog": "^1.1.2",
        zustand: "^5.0.0",
      },
      devDependencies: {
        tailwindcss: "^3.4.0",
        typescript: "^5.7.0",
        vitest: "^3.0.0",
        turbo: "^2.3.0",
        "drizzle-kit": "^0.30.0",
      },
    };

    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify(packageJsonContent, null, 2),
    );
    await fs.writeFile(
      path.join(tempDir, "tailwind.config.ts"),
      "export default {};",
    );
    await fs.writeFile(
      path.join(tempDir, "drizzle.config.ts"),
      "export default {};",
    );
    await fs.writeFile(path.join(tempDir, "components.json"), "{}");
    await fs.writeFile(
      path.join(tempDir, "src", "app", "page.tsx"),
      "export default function Page() {}",
    );
    await fs.writeFile(
      path.join(tempDir, "src", "components", "dialog.tsx"),
      "export const D = 1;",
    );

    const scanResult = await scanFileSystem({ workspacePath: tempDir });
    const stack = await detectTechnologies(tempDir, scanResult.files);

    // Validate against Zod schema
    expect(() => TechnologyStackSchema.parse(stack)).not.toThrow();

    // Verify Frameworks
    const frameworkNames = stack.frameworks.map((f) => f.name);
    expect(frameworkNames).toContain("Next.js");
    expect(frameworkNames).toContain("React");

    const nextTag = stack.frameworks.find((f) => f.name === "Next.js");
    expect(nextTag?.version).toBe("15.1.0");
    expect(nextTag?.evidence.filePath).toBe("package.json");

    // Verify Styling
    const stylingNames = stack.styling.map((s) => s.name);
    expect(stylingNames).toContain("Tailwind CSS");

    // Verify Database
    const dbNames = stack.database.map((d) => d.name);
    expect(dbNames).toContain("Drizzle ORM");

    // Verify State Management
    const stateNames = stack.stateManagement.map((s) => s.name);
    expect(stateNames).toContain("Zustand");

    // Verify UI Libraries
    const uiNames = stack.uiLibraries.map((u) => u.name);
    expect(uiNames).toContain("Radix UI");
    expect(uiNames).toContain("shadcn/ui");
    expect(uiNames).toContain("Lucide Icons");

    // Verify Build Tools / Testing
    const toolNames = stack.buildTools.map((t) => t.name);
    expect(toolNames).toContain("TypeScript");
    expect(toolNames).toContain("Turborepo");
    expect(toolNames).toContain("Vitest");

    // Verify primary language
    expect(stack.primaryLanguage).toBe("TypeScript");
  });

  it("handles empty or non-package repositories gracefully", async () => {
    await fs.writeFile(path.join(tempDir, "script.py"), "print('hello')\n");

    const stack = await detectTechnologies(tempDir);

    expect(() => TechnologyStackSchema.parse(stack)).not.toThrow();
    expect(stack.primaryLanguage).toBe("Python");
    expect(stack.frameworks).toHaveLength(0);
    expect(stack.database).toHaveLength(0);
    expect(stack.styling).toHaveLength(0);
  });
});

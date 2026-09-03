import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  extractDesignSystem,
  parseCssVariablesFromContent,
  normalizeCssColor,
  scanTopTailwindClasses,
  detectDesignLibraries,
} from "../src/design/index";
import { DesignSystemSummarySchema } from "@codexel/shared";

describe("Design System Intelligence & Token Extraction", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codexel-design-test-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignored
    }
  });

  it("normalizes CSS color formats correctly", () => {
    expect(normalizeCssColor("222.2 84% 4.9%")).toBe("hsl(222.2, 84%, 4.9%)");
    expect(normalizeCssColor("0 0% 100%")).toBe("hsl(0, 0%, 100%)");
    expect(normalizeCssColor("#0F172A")).toBe("#0F172A");
    expect(normalizeCssColor("rgb(15, 23, 42)")).toBe("rgb(15, 23, 42)");
  });

  it("extracts CSS variables and classifies tokens from stylesheet contents", () => {
    const css = `
      :root {
        --background: 0 0% 100%;
        --foreground: 222.2 84% 4.9%;
        --primary: 222.2 47.4% 11.2%;
        --radius: 0.5rem;
        --font-sans: "Inter", sans-serif;
      }
      .dark {
        --background: 222.2 84% 4.9%;
        --foreground: 210 40% 98%;
      }
    `;

    const parsed = parseCssVariablesFromContent(css);
    expect(parsed.variables["--background"]).toBe("0 0% 100%");
    expect(parsed.variables["--primary"]).toBe("222.2 47.4% 11.2%");
    expect(parsed.variables["--radius"]).toBe("0.5rem");

    const bg = parsed.colors.find((c) => c.name === "background");
    expect(bg).toBeDefined();
    expect(bg?.value).toBe("hsl(0, 0%, 100%)");

    expect(parsed.borderRadii).toContain("0.5rem");
    expect(parsed.fontFamilies.length).toBeGreaterThan(0);
  });

  it("scans JSX/TSX files for top recurring Tailwind utility classes", async () => {
    await fs.mkdir(path.join(tempDir, "src", "components"), {
      recursive: true,
    });

    await fs.writeFile(
      path.join(tempDir, "src", "components", "Card.tsx"),
      `export function Card() {
        return (
          <div className="flex items-center justify-between p-4 bg-white rounded-lg">
            <span className="text-sm font-bold text-slate-900">Title</span>
            <button className="flex items-center text-sm font-bold">Action</button>
          </div>
        );
      }`,
    );

    await fs.writeFile(
      path.join(tempDir, "src", "components", "Button.tsx"),
      `export function Button() {
        return <button className="flex items-center px-4 py-2 text-sm">Click</button>;
      }`,
    );

    const topClasses = await scanTopTailwindClasses(tempDir);
    expect(topClasses.length).toBeGreaterThan(0);

    const flex = topClasses.find((c) => c.className === "flex");
    expect(flex).toBeDefined();
    expect(flex?.count).toBe(3);

    const itemsCenter = topClasses.find((c) => c.className === "items-center");
    expect(itemsCenter).toBeDefined();
    expect(itemsCenter?.count).toBe(3);

    const textSm = topClasses.find((c) => c.className === "text-sm");
    expect(textSm).toBeDefined();
    expect(textSm?.count).toBe(3);
  });

  it("detects UI, icon, and animation libraries from package.json", async () => {
    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-app",
        dependencies: {
          "@radix-ui/react-dialog": "^1.1.0",
          "lucide-react": "^0.378.0",
          "tailwindcss-animate": "^1.0.7",
        },
      }),
    );

    const libs = await detectDesignLibraries(tempDir);
    expect(libs.uiPrimitiveLibrary).toBe("Radix UI Primitives");
    expect(libs.iconLibrary).toBe("Lucide React");
    expect(libs.animationLibrary).toBe("tailwindcss-animate");
  });

  it("executes full extractDesignSystem and validates against Zod schema", async () => {
    await fs.mkdir(path.join(tempDir, "src"), { recursive: true });

    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: {
          "lucide-react": "^0.378.0",
        },
      }),
    );

    await fs.writeFile(
      path.join(tempDir, "src", "globals.css"),
      `:root {
        --background: #FFFFFF;
        --primary: #0F172A;
        --radius: 8px;
      }`,
    );

    await fs.writeFile(
      path.join(tempDir, "src", "Component.tsx"),
      `export const C = () => <div className="flex items-center text-xs" />;`,
    );

    const summary = await extractDesignSystem(tempDir);

    expect(() => DesignSystemSummarySchema.parse(summary)).not.toThrow();
    expect(summary.colorPalette.length).toBeGreaterThanOrEqual(2);
    expect(summary.libraries.iconLibrary).toBe("Lucide React");
    expect(summary.topTailwindClasses.some((c) => c.className === "flex")).toBe(
      true,
    );
  });

  it("mines colors from utility classes when no custom CSS variables are defined", async () => {
    await fs.mkdir(path.join(tempDir, "src"), { recursive: true });

    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: {
          react: "^18.0.0",
        },
      }),
    );

    // Component using standard Tailwind colors & arbitrary hex
    await fs.writeFile(
      path.join(tempDir, "src", "Hero.tsx"),
      `export function Hero() {
        return (
          <div className="bg-indigo-600 text-slate-900 border-emerald-500 bg-[#0f172a]">
            <h1 className="text-amber-500">Hello</h1>
          </div>
        );
      }`,
    );

    const summary = await extractDesignSystem(tempDir);
    expect(() => DesignSystemSummarySchema.parse(summary)).not.toThrow();
    expect(summary.colorPalette.length).toBeGreaterThan(0);

    const indigo = summary.colorPalette.find((c) => c.name === "indigo-600");
    expect(indigo).toBeDefined();
    expect(indigo?.value).toBe("#4f46e5");
    expect(indigo?.source).toBe("theme-object");

    const customHex = summary.colorPalette.find((c) => c.value === "#0f172a");
    expect(customHex).toBeDefined();
  });

  it("extracts Tailwind v4 @theme tokens from stylesheets", () => {
    const v4Css = `
      @theme {
        --color-brand: #3b82f6;
        --color-accent: oklch(0.6 0.2 240);
        --font-display: "Cabinet Grotesk", sans-serif;
        --radius-lg: 1rem;
      }
    `;

    const parsed = parseCssVariablesFromContent(v4Css);
    expect(parsed.variables["--color-brand"]).toBe("#3b82f6");
    expect(parsed.variables["--color-accent"]).toBe("oklch(0.6 0.2 240)");

    const brand = parsed.colors.find((c) => c.name === "brand");
    expect(brand).toBeDefined();
    expect(brand?.value).toBe("#3b82f6");

    expect(parsed.borderRadii).toContain("1rem");
    expect(parsed.fontFamilies).toContain("Cabinet Grotesk, sans-serif");
  });
});

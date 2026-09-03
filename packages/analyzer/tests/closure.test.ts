import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { extractComponentInventory } from "../src/components/index";
import { computeComponentClosure } from "../src/components/closure-resolver";
import { ComponentBundleSchema } from "@codexel/shared";

describe("Component Reuse & Transitive Dependency Closure", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codexel-closure-test-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignored
    }
  });

  it("traverses transitive dependencies, collects external packages, and builds install commands", async () => {
    await fs.mkdir(path.join(tempDir, "src", "ui"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "src", "features"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "src", "lib"), { recursive: true });

    // 1. Shared utility file
    await fs.writeFile(
      path.join(tempDir, "src", "lib", "utils.ts"),
      `import { clsx, type ClassValue } from "clsx";
       import { twMerge } from "tailwind-merge";
       export function cn(...inputs: ClassValue[]) {
         return twMerge(clsx(inputs));
       }`,
    );

    // 2. Button component importing utils and @radix-ui/react-slot
    await fs.writeFile(
      path.join(tempDir, "src", "ui", "Button.tsx"),
      `import React from "react";
       import { Slot } from "@radix-ui/react-slot";
       import { cn } from "../lib/utils";
       export interface ButtonProps {
         asChild?: boolean;
         className?: string;
         children?: React.ReactNode;
       }
       export function Button({ asChild, className, children }: ButtonProps) {
         const Comp = asChild ? Slot : "button";
         return <Comp className={cn("btn", className)}>{children}</Comp>;
       }`,
    );

    // 3. Icon primitive importing lucide-react
    await fs.writeFile(
      path.join(tempDir, "src", "ui", "Icon.tsx"),
      `import React from "react";
       import { Check } from "lucide-react";
       export const Icon = () => <Check className="w-4 h-4" />;`,
    );

    // 4. Feature Card importing Button and Icon
    await fs.writeFile(
      path.join(tempDir, "src", "features", "AuthCard.tsx"),
      `import React from "react";
       import { Button } from "../ui/Button";
       import { Icon } from "../ui/Icon";
       export function AuthCard() {
         return (
           <div className="card">
             <Icon />
             <Button>Sign In</Button>
           </div>
         );
       }`,
    );

    const inventory = await extractComponentInventory(tempDir);

    const authCardComponent = inventory.components.find(
      (c) => c.name === "AuthCard",
    );
    expect(authCardComponent).toBeDefined();

    const bundle = await computeComponentClosure({
      componentId: authCardComponent!.id,
      workspacePath: tempDir,
      components: inventory.components,
      packageDependencies: {
        clsx: "^2.1.0",
        "tailwind-merge": "^2.2.0",
        "@radix-ui/react-slot": "^1.0.2",
        "lucide-react": "^0.370.0",
      },
    });

    // Validate with Zod schema
    expect(() => ComponentBundleSchema.parse(bundle)).not.toThrow();

    expect(bundle.componentName).toBe("AuthCard");
    expect(bundle.files.length).toBe(4);

    // Verify all 4 transitive files are present
    const filePaths = bundle.files.map((f) => f.filePath.replace(/\\/g, "/"));
    expect(filePaths.some((p) => p.includes("AuthCard.tsx"))).toBe(true);
    expect(filePaths.some((p) => p.includes("Button.tsx"))).toBe(true);
    expect(filePaths.some((p) => p.includes("Icon.tsx"))).toBe(true);
    expect(filePaths.some((p) => p.includes("utils.ts"))).toBe(true);

    // Main component should be marked as isMainComponent = true
    const mainFile = bundle.files.find((f) => f.isMainComponent);
    expect(mainFile).toBeDefined();
    expect(mainFile?.fileName).toBe("AuthCard.tsx");

    // Utilities classification
    const utilFile = bundle.files.find((f) => f.fileName === "utils.ts");
    expect(utilFile?.fileType).toBe("utility");
    expect(utilFile?.content).toContain("export function cn");

    // Verify external packages
    const pkgNames = bundle.externalPackages.map((p) => p.name);
    expect(pkgNames).toContain("@radix-ui/react-slot");
    expect(pkgNames).toContain("lucide-react");
    expect(pkgNames).toContain("clsx");
    expect(pkgNames).toContain("tailwind-merge");

    // Verify versions attached
    const radixPkg = bundle.externalPackages.find(
      (p) => p.name === "@radix-ui/react-slot",
    );
    expect(radixPkg?.version).toBe("^1.0.2");

    // Verify install commands
    expect(bundle.installCommands.pnpm).toContain("pnpm add");
    expect(bundle.installCommands.pnpm).toContain("@radix-ui/react-slot@1.0.2");
    expect(bundle.installCommands.npm).toContain("npm install");
    expect(bundle.installCommands.bun).toContain("bun add");

    // Verify summary stats
    expect(bundle.summary.totalFiles).toBe(4);
    expect(bundle.summary.totalLinesOfCode).toBeGreaterThan(0);
    expect(bundle.summary.totalSizeBytes).toBeGreaterThan(0);
  });

  it("handles circular dependency imports gracefully without infinite recursion", async () => {
    await fs.mkdir(path.join(tempDir, "src"), { recursive: true });

    // File A imports File B
    await fs.writeFile(
      path.join(tempDir, "src", "CompA.tsx"),
      `import React from "react";
       import { CompB } from "./CompB";
       export function CompA() {
         return <div><CompB /></div>;
       }`,
    );

    // File B imports File A
    await fs.writeFile(
      path.join(tempDir, "src", "CompB.tsx"),
      `import React from "react";
       import { CompA } from "./CompA";
       export function CompB() {
         return <div><CompA /></div>;
       }`,
    );

    const inventory = await extractComponentInventory(tempDir);
    const compA = inventory.components.find((c) => c.name === "CompA");
    expect(compA).toBeDefined();

    const bundle = await computeComponentClosure({
      componentId: compA!.id,
      workspacePath: tempDir,
      components: inventory.components,
    });

    expect(bundle.files.length).toBe(2);
    expect(bundle.componentName).toBe("CompA");
  });
});

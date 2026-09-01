import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { extractComponentInventory } from "../src/components/index";
import { ComponentInventorySchema } from "@codexel/shared";

describe("React Component Discovery & Metadata Extraction", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codexel-comp-test-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignored
    }
  });

  it("detects function, arrow, and class components with props, child elements, and usage footprints", async () => {
    await fs.mkdir(path.join(tempDir, "src", "ui"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "src", "features"), { recursive: true });

    // 1. Primitive component with typed interface
    await fs.writeFile(
      path.join(tempDir, "src", "ui", "Button.tsx"),
      `import React from "react";
       export interface ButtonProps {
         label: string;
         variant?: "primary" | "secondary";
         disabled?: boolean;
       }
       export function Button({ label, variant = "primary", disabled = false }: ButtonProps) {
         return <button className={variant} disabled={disabled}>{label}</button>;
       }`,
    );

    // 2. Icon primitive
    await fs.writeFile(
      path.join(tempDir, "src", "ui", "Icon.tsx"),
      `export const Icon = ({ name }: { name: string }) => <span className={name} />;`,
    );

    // 3. Feature component rendering Button & Icon
    await fs.writeFile(
      path.join(tempDir, "src", "features", "LoginForm.tsx"),
      `import React from "react";
       import { Button } from "../ui/Button";
       import { Icon } from "../ui/Icon";
       export default function LoginForm() {
         return (
           <form>
             <Icon name="lock" />
             <Button label="Sign In" />
           </form>
         );
       }`,
    );

    const inventory = await extractComponentInventory(tempDir);

    // Validate with Zod schema
    expect(() => ComponentInventorySchema.parse(inventory)).not.toThrow();

    expect(inventory.totalComponents).toBe(3);

    // Test Button component
    const btn = inventory.components.find((c) => c.name === "Button");
    expect(btn).toBeDefined();
    expect(btn?.category).toBe("ui-primitive");
    expect(btn?.props.map((p) => p.name)).toContain("label");
    expect(btn?.props.map((p) => p.name)).toContain("variant");

    const labelProp = btn?.props.find((p) => p.name === "label");
    expect(labelProp?.isRequired).toBe(true);

    const variantProp = btn?.props.find((p) => p.name === "variant");
    expect(variantProp?.isRequired).toBe(false);

    // Test LoginForm component
    const login = inventory.components.find((c) => c.name === "LoginForm");
    expect(login).toBeDefined();
    expect(login?.category).toBe("form");
    expect(login?.childComponents).toContain("Button");
    expect(login?.childComponents).toContain("Icon");
    expect(login?.isDefaultExport).toBe(true);

    // Test usedBy tracking on Button
    expect(btn?.usedBy.some((u) => u.filePath.includes("LoginForm.tsx"))).toBe(true);
  });
});

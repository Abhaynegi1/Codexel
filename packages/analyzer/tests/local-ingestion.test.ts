import { describe, it, expect } from "vitest";
import { analyzeInMemoryFiles } from "../src/ingestion/local-analyzer";
import { RepositoryLimitExceededError } from "../src/ingestion/errors";

describe("Local Workspace & In-Memory Ingestion", () => {
  it("successfully analyzes in-memory source files and extracts components and architecture", async () => {
    const files = [
      {
        path: "package.json",
        content: JSON.stringify({
          name: "my-local-dashboard",
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
            "lucide-react": "^0.300.0",
          },
          devDependencies: {
            tailwindcss: "^3.4.0",
            typescript: "^5.0.0",
          },
        }),
      },
      {
        path: "src/components/ui/Button.tsx",
        content: `
import React from 'react';
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', children, onClick }) => {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded font-medium shadow" onClick={onClick}>
      {children}
    </button>
  );
};
export default Button;
`,
      },
      {
        path: "src/components/dashboard/Header.tsx",
        content: `
import React from 'react';
import { Button } from '../ui/Button';

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-200">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
      <Button variant="primary">New Project</Button>
    </header>
  );
}
`,
      },
      {
        path: "src/app/page.tsx",
        content: `
import React from 'react';
import { Header } from '@/components/dashboard/Header';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
    </main>
  );
}
`,
      },
      {
        path: "src/styles/globals.css",
        content: `
:root {
  --primary: #2563eb;
  --background: #ffffff;
  --foreground: #0f172a;
}
body {
  color: var(--foreground);
  background: var(--background);
}
`,
      },
    ];

    const model = await analyzeInMemoryFiles({
      name: "my-local-dashboard",
      files,
    });

    expect(model).toBeDefined();
    expect(model.metadata.name).toBe("my-local-dashboard");
    expect(model.metadata.owner).toBe("local");
    expect(model.fileSystem.totalFiles).toBe(5);

    // Component assertions
    expect(model.components.totalComponents).toBeGreaterThanOrEqual(2);
    const buttonComp = model.components.components.find(
      (c) => c.name === "Button",
    );
    expect(buttonComp).toBeDefined();
    expect(buttonComp?.props.length).toBeGreaterThanOrEqual(3);

    // Architecture & design system assertions
    expect(model.architecture.layers.length).toBeGreaterThan(0);
    expect(model.designSystem.colorPalette.length).toBeGreaterThan(0);
  });

  it("throws RepositoryLimitExceededError when file count limit is exceeded", async () => {
    const files = [
      { path: "f1.ts", content: "export const a = 1;" },
      { path: "f2.ts", content: "export const b = 2;" },
      { path: "f3.ts", content: "export const c = 3;" },
    ];

    await expect(
      analyzeInMemoryFiles({
        name: "test-limit",
        files,
        maxFiles: 2,
      }),
    ).rejects.toThrow(RepositoryLimitExceededError);
  });

  it("throws RepositoryLimitExceededError when size limit is exceeded", async () => {
    const files = [{ path: "large.ts", content: "x".repeat(5000) }];

    await expect(
      analyzeInMemoryFiles({
        name: "test-size-limit",
        files,
        maxSizeBytes: 1000,
      }),
    ).rejects.toThrow(RepositoryLimitExceededError);
  });
});

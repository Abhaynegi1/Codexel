import type { TechnologyTag } from "@codexel/shared";
import type { ParsedManifest } from "./manifest-parser";
import type { FileMetadata } from "@codexel/shared";

export type StackField =
  | "frameworks"
  | "styling"
  | "database"
  | "stateManagement"
  | "uiLibraries"
  | "buildTools";

export interface TechnologyRule {
  name: string;
  category: TechnologyTag["category"];
  targetField: StackField;
  packages?: Array<{
    name: string;
    isPrefix?: boolean;
    description?: string;
  }>;
  fileMatches?: Array<{
    regex: RegExp;
    description: string;
  }>;
}

export const TECHNOLOGY_RULES: TechnologyRule[] = [
  // ── Frameworks ────────────────────────────────────────────────────────
  {
    name: "Next.js",
    category: "framework",
    targetField: "frameworks",
    packages: [{ name: "next", description: "Next.js full-stack framework" }],
    fileMatches: [{ regex: /next\.config\.(js|mjs|ts)$/i, description: "Next.js configuration file" }],
  },
  {
    name: "React",
    category: "framework",
    targetField: "frameworks",
    packages: [{ name: "react", description: "React UI library" }],
  },
  {
    name: "Vite",
    category: "framework",
    targetField: "frameworks",
    packages: [{ name: "vite", description: "Vite frontend tooling and dev server" }],
    fileMatches: [{ regex: /vite\.config\.(js|mjs|ts)$/i, description: "Vite configuration file" }],
  },
  {
    name: "Remix",
    category: "framework",
    targetField: "frameworks",
    packages: [
      { name: "@remix-run/react", description: "Remix full-stack web framework" },
      { name: "@remix-run/node", description: "Remix server adapter" },
    ],
  },
  {
    name: "Astro",
    category: "framework",
    targetField: "frameworks",
    packages: [{ name: "astro", description: "Astro content-driven web framework" }],
    fileMatches: [{ regex: /astro\.config\.(mjs|ts|js)$/i, description: "Astro configuration file" }],
  },
  {
    name: "Vue",
    category: "framework",
    targetField: "frameworks",
    packages: [{ name: "vue", description: "Vue progressive JavaScript framework" }],
  },
  {
    name: "Svelte",
    category: "framework",
    targetField: "frameworks",
    packages: [
      { name: "svelte", description: "Svelte reactive UI compiler" },
      { name: "@sveltejs/kit", description: "SvelteKit web application framework" },
    ],
    fileMatches: [{ regex: /svelte\.config\.(js|ts)$/i, description: "Svelte configuration file" }],
  },
  {
    name: "Express",
    category: "framework",
    targetField: "frameworks",
    packages: [{ name: "express", description: "Express HTTP server framework" }],
  },
  {
    name: "Fastify",
    category: "framework",
    targetField: "frameworks",
    packages: [{ name: "fastify", description: "Fastify high-performance HTTP server" }],
  },
  {
    name: "NestJS",
    category: "framework",
    targetField: "frameworks",
    packages: [{ name: "@nestjs/core", description: "NestJS enterprise Node.js framework" }],
  },

  // ── Styling ───────────────────────────────────────────────────────────
  {
    name: "Tailwind CSS",
    category: "styling",
    targetField: "styling",
    packages: [{ name: "tailwindcss", description: "Utility-first CSS framework" }],
    fileMatches: [{ regex: /tailwind\.config\.(js|cjs|mjs|ts)$/i, description: "Tailwind CSS configuration file" }],
  },
  {
    name: "PostCSS",
    category: "styling",
    targetField: "styling",
    packages: [{ name: "postcss", description: "Tool for transforming CSS with plugins" }],
    fileMatches: [{ regex: /postcss\.config\.(js|cjs|mjs|ts|json)$/i, description: "PostCSS configuration file" }],
  },
  {
    name: "CSS Modules",
    category: "styling",
    targetField: "styling",
    fileMatches: [{ regex: /\.module\.(css|scss|sass|less)$/i, description: "Scoped CSS Module stylesheet" }],
  },
  {
    name: "Styled Components",
    category: "styling",
    targetField: "styling",
    packages: [{ name: "styled-components", description: "Visual primitives for styling React components" }],
  },
  {
    name: "Emotion",
    category: "styling",
    targetField: "styling",
    packages: [
      { name: "@emotion/react", description: "Emotion CSS-in-JS library" },
      { name: "@emotion/styled", description: "Emotion styled components" },
    ],
  },
  {
    name: "Sass",
    category: "styling",
    targetField: "styling",
    packages: [
      { name: "sass", description: "Dart Sass preprocessor" },
      { name: "node-sass", description: "Node Sass preprocessor" },
    ],
    fileMatches: [{ regex: /\.(scss|sass)$/i, description: "Sass stylesheet" }],
  },
  {
    name: "Vanilla Extract",
    category: "styling",
    targetField: "styling",
    packages: [{ name: "@vanilla-extract/css", description: "Zero-runtime stylesheets-in-TypeScript" }],
    fileMatches: [{ regex: /\.css\.ts$/i, description: "Vanilla Extract stylesheet file" }],
  },

  // ── Databases & ORMs ──────────────────────────────────────────────────
  {
    name: "Drizzle ORM",
    category: "database",
    targetField: "database",
    packages: [
      { name: "drizzle-orm", description: "TypeScript ORM for SQL databases" },
      { name: "drizzle-kit", description: "Migration and schema management tool for Drizzle" },
    ],
    fileMatches: [{ regex: /drizzle\.config\.(js|ts)$/i, description: "Drizzle ORM configuration file" }],
  },
  {
    name: "Prisma",
    category: "database",
    targetField: "database",
    packages: [
      { name: "@prisma/client", description: "Next-generation ORM query client" },
      { name: "prisma", description: "Prisma CLI and schema compiler" },
    ],
    fileMatches: [{ regex: /schema\.prisma$/i, description: "Prisma data model schema" }],
  },
  {
    name: "Supabase",
    category: "database",
    targetField: "database",
    packages: [{ name: "@supabase/supabase-js", description: "Supabase client library" }],
  },
  {
    name: "Mongoose",
    category: "database",
    targetField: "database",
    packages: [{ name: "mongoose", description: "MongoDB object modeling tool" }],
  },
  {
    name: "TypeORM",
    category: "database",
    targetField: "database",
    packages: [{ name: "typeorm", description: "TypeORM ORM for TypeScript" }],
  },
  {
    name: "Kysely",
    category: "database",
    targetField: "database",
    packages: [{ name: "kysely", description: "Type-safe SQL query builder for TypeScript" }],
  },

  // ── State Management ──────────────────────────────────────────────────
  {
    name: "Redux Toolkit",
    category: "state",
    targetField: "stateManagement",
    packages: [
      { name: "@reduxjs/toolkit", description: "Official toolset for efficient Redux development" },
      { name: "react-redux", description: "Official React bindings for Redux" },
    ],
  },
  {
    name: "Zustand",
    category: "state",
    targetField: "stateManagement",
    packages: [{ name: "zustand", description: "Bearbones state management library" }],
  },
  {
    name: "Jotai",
    category: "state",
    targetField: "stateManagement",
    packages: [{ name: "jotai", description: "Primitive and flexible state management for React" }],
  },
  {
    name: "Recoil",
    category: "state",
    targetField: "stateManagement",
    packages: [{ name: "recoil", description: "State management library for React" }],
  },
  {
    name: "TanStack Query",
    category: "state",
    targetField: "stateManagement",
    packages: [
      { name: "@tanstack/react-query", description: "Powerful asynchronous state management" },
      { name: "react-query", description: "React Query data-fetching and caching library" },
    ],
  },
  {
    name: "MobX",
    category: "state",
    targetField: "stateManagement",
    packages: [
      { name: "mobx", description: "Simple, scalable state management" },
      { name: "mobx-react-lite", description: "MobX React bindings" },
    ],
  },

  // ── UI Libraries ──────────────────────────────────────────────────────
  {
    name: "Radix UI",
    category: "ui-library",
    targetField: "uiLibraries",
    packages: [
      { name: "@radix-ui/", isPrefix: true, description: "Unstyled, accessible UI primitives" },
    ],
  },
  {
    name: "shadcn/ui",
    category: "ui-library",
    targetField: "uiLibraries",
    fileMatches: [{ regex: /components\.json$/i, description: "shadcn/ui configuration file" }],
  },
  {
    name: "Material UI",
    category: "ui-library",
    targetField: "uiLibraries",
    packages: [
      { name: "@mui/material", description: "MUI React component library" },
      { name: "@material-ui/core", description: "Legacy Material-UI components" },
    ],
  },
  {
    name: "Lucide Icons",
    category: "ui-library",
    targetField: "uiLibraries",
    packages: [
      { name: "lucide-react", description: "Lucide icon library for React" },
      { name: "lucide-vue-next", description: "Lucide icon library for Vue" },
      { name: "lucide-svelte", description: "Lucide icon library for Svelte" },
    ],
  },
  {
    name: "Mantine",
    category: "ui-library",
    targetField: "uiLibraries",
    packages: [{ name: "@mantine/core", description: "Mantine React components library" }],
  },
  {
    name: "Chakra UI",
    category: "ui-library",
    targetField: "uiLibraries",
    packages: [{ name: "@chakra-ui/react", description: "Simple, modular and accessible component library" }],
  },
  {
    name: "Ant Design",
    category: "ui-library",
    targetField: "uiLibraries",
    packages: [{ name: "antd", description: "Enterprise-class UI design language and React library" }],
  },

  // ── Build Tools & Tooling ─────────────────────────────────────────────
  {
    name: "Turborepo",
    category: "tooling",
    targetField: "buildTools",
    packages: [{ name: "turbo", description: "High-performance build system for TypeScript monorepos" }],
    fileMatches: [{ regex: /turbo\.json$/i, description: "Turborepo pipeline configuration file" }],
  },
  {
    name: "TypeScript",
    category: "tooling",
    targetField: "buildTools",
    packages: [{ name: "typescript", description: "TypeScript language compiler and typechecker" }],
    fileMatches: [{ regex: /tsconfig.*\.json$/i, description: "TypeScript compiler configuration file" }],
  },
  {
    name: "Webpack",
    category: "tooling",
    targetField: "buildTools",
    packages: [{ name: "webpack", description: "Module bundler for JavaScript" }],
    fileMatches: [{ regex: /webpack\.config\.(js|ts|cjs)$/i, description: "Webpack configuration file" }],
  },
  {
    name: "Rollup",
    category: "tooling",
    targetField: "buildTools",
    packages: [{ name: "rollup", description: "Module bundler for JavaScript libraries" }],
    fileMatches: [{ regex: /rollup\.config\.(js|mjs|ts)$/i, description: "Rollup configuration file" }],
  },
  {
    name: "esbuild",
    category: "tooling",
    targetField: "buildTools",
    packages: [{ name: "esbuild", description: "Extremely fast JavaScript bundler" }],
  },
  {
    name: "ESLint",
    category: "tooling",
    targetField: "buildTools",
    packages: [{ name: "eslint", description: "JavaScript and TypeScript linting utility" }],
    fileMatches: [
      { regex: /eslint\.config\.(js|mjs|cjs|ts)$/i, description: "ESLint flat configuration file" },
      { regex: /\.eslintrc(\.(js|json|yml|yaml))?$/i, description: "ESLint configuration file" },
    ],
  },
  {
    name: "Prettier",
    category: "tooling",
    targetField: "buildTools",
    packages: [{ name: "prettier", description: "Opinionated code formatter" }],
    fileMatches: [{ regex: /\.prettierrc(\.(js|json|yml|yaml))?$/i, description: "Prettier configuration file" }],
  },
  {
    name: "Biome",
    category: "tooling",
    targetField: "buildTools",
    packages: [{ name: "@biomejs/biome", description: "Fast formatter and linter for web development" }],
    fileMatches: [{ regex: /biome\.json$/i, description: "Biome configuration file" }],
  },

  // ── Testing (placed in buildTools) ────────────────────────────────────
  {
    name: "Vitest",
    category: "testing",
    targetField: "buildTools",
    packages: [{ name: "vitest", description: "Next generation testing framework powered by Vite" }],
    fileMatches: [{ regex: /vitest\.config\.(js|mjs|ts)$/i, description: "Vitest configuration file" }],
  },
  {
    name: "Jest",
    category: "testing",
    targetField: "buildTools",
    packages: [
      { name: "jest", description: "Delightful JavaScript testing framework" },
      { name: "@types/jest", description: "Jest type definitions" },
    ],
    fileMatches: [{ regex: /jest\.config\.(js|ts|json)$/i, description: "Jest configuration file" }],
  },
  {
    name: "Playwright",
    category: "testing",
    targetField: "buildTools",
    packages: [{ name: "@playwright/test", description: "End-to-end testing for modern web apps" }],
    fileMatches: [{ regex: /playwright\.config\.(js|ts)$/i, description: "Playwright configuration file" }],
  },
  {
    name: "Cypress",
    category: "testing",
    targetField: "buildTools",
    packages: [{ name: "cypress", description: "Next-gen front end testing tool" }],
    fileMatches: [{ regex: /cypress\.config\.(js|ts)$/i, description: "Cypress configuration file" }],
  },
];

/**
 * Matches manifests and files against technology rules to produce categorized tags.
 */
export function evaluateTechnologyRules(
  manifests: ParsedManifest[],
  files: FileMetadata[],
): Record<StackField, TechnologyTag[]> {
  const result: Record<StackField, TechnologyTag[]> = {
    frameworks: [],
    styling: [],
    database: [],
    stateManagement: [],
    uiLibraries: [],
    buildTools: [],
  };

  // Set of found rule names per target field to avoid duplicates
  const seenPerField = new Map<StackField, Set<string>>();
  for (const field of Object.keys(result) as StackField[]) {
    seenPerField.set(field, new Set());
  }

  for (const rule of TECHNOLOGY_RULES) {
    let matchedTag: TechnologyTag | null = null;

    // 1. Check manifests (dependencies and devDependencies)
    for (const manifest of manifests) {
      const allDeps = {
        ...manifest.dependencies,
        ...manifest.devDependencies,
        ...manifest.peerDependencies,
      };

      if (rule.packages) {
        for (const pkgRule of rule.packages) {
          if (pkgRule.isPrefix) {
            const matchedDep = Object.keys(allDeps).find((d) => d.startsWith(pkgRule.name));
            if (matchedDep) {
              const version = allDeps[matchedDep];
              matchedTag = {
                name: rule.name,
                version: version ? version.replace(/^[~^]/, "") : undefined,
                category: rule.category,
                evidence: {
                  filePath: manifest.filePath,
                  matchedPackage: matchedDep,
                  description: pkgRule.description || `Detected package ${matchedDep}`,
                },
              };
              break;
            }
          } else if (allDeps[pkgRule.name]) {
            const version = allDeps[pkgRule.name];
            matchedTag = {
              name: rule.name,
              version: version ? version.replace(/^[~^]/, "") : undefined,
              category: rule.category,
              evidence: {
                filePath: manifest.filePath,
                matchedPackage: pkgRule.name,
                description: pkgRule.description || `Detected package ${pkgRule.name}`,
              },
            };
            break;
          }
        }
      }

      if (matchedTag) break;
    }

    // 2. If no package matched, check fileMatches
    if (!matchedTag && rule.fileMatches) {
      for (const fileMatch of rule.fileMatches) {
        const foundFile = files.find((f) => fileMatch.regex.test(f.path));
        if (foundFile) {
          matchedTag = {
            name: rule.name,
            category: rule.category,
            evidence: {
              filePath: foundFile.path,
              description: fileMatch.description,
            },
          };
          break;
        }
      }
    }

    // If tag matched, record under targetField
    if (matchedTag) {
      const seen = seenPerField.get(rule.targetField)!;
      if (!seen.has(rule.name)) {
        seen.add(rule.name);
        result[rule.targetField].push(matchedTag);
      }
    }
  }

  return result;
}

# Codexel — System Architecture & Technical Specification

> **Version**: 1.0.0-draft  
> **Status**: Approved Foundation  
> **Author**: Codexel Engineering

---

## 1. System Overview & Core Tenet

Codexel transforms arbitrary codebases into an interactive, visual, and semantically structured representation of their architecture, components, and design systems.

### Core Architectural Axiom: Deterministic Source of Truth

```text
       ┌─────────────────────────────────────────────────────────┐
       │                   Repository Source Code                │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │          Deterministic Static Analysis Engine           │
       │   (TypeScript Compiler API / Babel / Tree-sitter / PostCSS)│
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │            Structured Repository Model (JSON)           │
       │    (Strictly typed, versioned, verifiable facts & graph) │
       └────────────────────────────┬────────────────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│   Visual Explorer (UI)    │               │  Grounded AI Layer (LLM)  │
│  - Architecture Graph     │               │  - Architecture QA        │
│  - Component Inventory    │               │  - Onboarding Brief       │
│  - Design System Explorer │               │  - Never hallucinates     │
│  - Source Inspection      │               │    underlying code facts  │
└───────────────────────────┘               └───────────────────────────┘
```

**Non-Negotiable Design Rule**: An LLM must **never** be responsible for deriving repository facts (e.g., file counts, imports, component hierarchy, routes, CSS tokens). All factual data is derived deterministically via static analysis. AI is solely an interpretation layer querying the structured Repository Intelligence Model.

---

## 2. High-Level System Topology

```text
                           ┌───────────────────────────┐
                           │      Browser Client       │
                           │ (Next.js App / React Flow)│
                           └─────────────┬─────────────┘
                                         │  HTTPS / WSS / SSE
                                         ▼
                           ┌───────────────────────────┐
                           │      Next.js Web App      │
                           │  - Landing & Onboarding   │
                           │  - Explorer UI / Layouts  │
                           │  - Server Actions / API   │
                           └──────┬─────────────┬──────┘
                                  │             │
                    Job Enqueue   │             │ Read Model / Metadata
                                  ▼             ▼
              ┌──────────────────────┐      ┌────────────────────────┐
              │     Redis Queue      │      │     PostgreSQL DB      │
              │      (BullMQ)        │      │      (Drizzle ORM)     │
              └──────────┬───────────┘      └───────────▲────────────┘
                         │                              │
                         ▼ Job Claim                    │ Store Analysis Result
              ┌──────────────────────────────────────┐  │
              │         Analysis Worker              │──┘
              │  - Ingestion Sandbox (shallow clone) │
              │  - packages/analyzer pipeline        │
              │  - AST & Dependency Graph Engine     │
              │  - Design Token Extractor            │
              └──────────────────────────────────────┘
```

---

## 3. The Deterministic Analysis Pipeline

The analyzer (`packages/analyzer`) operates as a decoupled, standalone engine that accepts any local directory path (regardless of whether it originated from a Git clone, local folder, or unzipped archive).

```text
Local Workspace Path
        │
        ├── 1. Scanner Layer
        │     ├── Walk directory tree recursively
        │     ├── Apply ignore patterns (.gitignore, node_modules, dist, vendor)
        │     └── Catalog file metadata (path, size, extension, checksum)
        │
        ├── 2. Technology & Manifest Detector
        │     ├── Parse package.json, lockfiles, workspace configs (pnpm-workspace, lerna)
        │     ├── Detect tsconfig.json, babel.config, vite.config, next.config
        │     ├── Detect styling frameworks (Tailwind, Vanilla CSS, CSS Modules, Stitches)
        │     └── Detect database & ORM layers (Drizzle, Prisma, Supabase, TypeORM)
        │
        ├── 3. AST & Symbol Parser
        │     ├── Parse JS/TS/TSX using TypeScript Compiler API (with fallback parsers)
        │     ├── Extract Imports, Exports, and Named Declarations
        │     ├── Extract Components, Props, Hooks, and JSX Call Tree
        │     └── Extract Routing boundaries (Next.js App/Pages router, React Router)
        │
        ├── 4. Graph & Dependency Synthesis
        │     ├── Resolve module paths (tsconfig aliases `@/*`, relative paths)
        │     ├── Build directional Directed Acyclic Graph (DAG) of module dependencies
        │     └── Track external package dependencies per file and component
        │
        ├── 5. Architecture & Boundary Classifier
        │     ├── Classify directory roles (UI, Features, Server, Lib, Infrastructure)
        │     ├── Label Confirmed Facts vs Heuristic Inferences
        │     └── Establish cross-boundary invocation paths
        │
        ├── 6. Design System Intelligence
        │     ├── Parse CSS custom properties (`--primary: #...`, `:root`)
        │     ├── Extract Tailwind config theme extensions & inline utility distributions
        │     └── Catalog typography, spacing scales, border radii, and icon libraries
        │
        └── 7. Model Assembly & Validation
              └── Assemble and validate JSON against Zod schema (`RepositoryModelSchema`)
```

---

## 4. Subsystem Detailed Specifications

### 4.1. Ingestion & Workspace Isolation

```text
GitHub URL ──► Validate Format ──► Resolve Commit SHA (Git LS-Remote) ──► Check Cache
                                                                               │
                                                                   Miss ───────▼
                                                      Shallow Clone (--depth 1)
                                                                   │
                                                      Check Size & Safety Limits
                                                                   │
                                                      Dispatch to packages/analyzer
                                                                   │
                                                      Clean Up Temp Workspace
```

1. **URL Validation**: Accepts standard formats (`https://github.com/:owner/:repo`, including branch/tag deep links).
2. **Commit SHA Pinning**: Before cloning, performs a lightweight `git ls-remote` query to obtain the latest commit SHA for the target branch. This serves as the immutable cache key.
3. **Shallow Fetch**: Executes `git clone --depth 1 --filter=blob:limit=2M <repo-url> <temp_dir>`.
4. **Safety Boundaries**:
   - Max file limit: 10,000 files per repo (configurable).
   - Max repo payload: 150MB uncompressed.
   - Max analysis duration: 90 seconds timeout.
5. **No Execution Guarantee**: Neither `npm install`, `yarn`, `pnpm`, nor custom build hooks (`postinstall`, `prepare`) are ever triggered. Source code is only read as text.

---

### 4.2. Technology Detection Strategy

Detection uses deterministic file existence and package dependency markers:

| Layer              | Deterministic Marker Files                                           | Package.json Signatures                                    |
| :----------------- | :------------------------------------------------------------------- | :--------------------------------------------------------- |
| **Frameworks**     | `next.config.*`, `vite.config.*`, `astro.config.*`, `remix.config.*` | `next`, `vite`, `@remix-run/react`, `astro`, `nuxt`, `vue` |
| **UI Libraries**   | `components.json` (shadcn), `tailwind.config.*`                      | `@radix-ui/*`, `@chakra-ui/*`, `@mui/material`, `antd`     |
| **Styling**        | `tailwind.config.*`, `postcss.config.*`, `*.module.css`              | `tailwindcss`, `@vanilla-extract/css`, `styled-components` |
| **State / Query**  | `src/store/*`, `zustand`, `redux` files                              | `zustand`, `@reduxjs/toolkit`, `@tanstack/react-query`     |
| **Database / ORM** | `drizzle.config.*`, `prisma/schema.prisma`                           | `drizzle-orm`, `@prisma/client`, `typeorm`, `kysely`       |
| **APIs / Backend** | `app/api/**`, `pages/api/**`, `trpc/**`, `server/**`                 | `@trpc/server`, `express`, `fastify`, `hono`               |

---

### 4.3. Code Intelligence & AST Parsing

The parser extracts exact structural semantics from source files:

1. **Imports & Exports**:
   - Identifies default, named, namespace, and side-effect imports.
   - Resolves module aliases configured in `tsconfig.json` (`paths: { "@/*": ["./src/*"] }`).
2. **Component Detection**:
   - Identifies functions returning JSX (`JSX.Element`, React function signatures).
   - Extracts Component Name, Export Status, Line Range, and Props Interface.
   - Traces child JSX elements to map the parent-child rendering hierarchy.
3. **Routing Detection**:
   - Next.js App Router (`app/**/page.tsx`, `layout.tsx`, `route.ts`).
   - Next.js Pages Router (`pages/**/*.tsx`).
   - React Router / TanStack Router route definitions.

---

### 4.4. Architecture Classification: Facts vs. Heuristics

To maintain high developer trust, Codexel partitions findings into two distinct buckets:

```json
{
  "layer": "Infrastructure",
  "category": "Database Access",
  "classification": {
    "isConfirmedFact": true,
    "evidence": "Imports 'drizzle-orm' and defines DB schema in 'src/database/schema.ts:12'",
    "heuristicConfidence": 1.0
  }
}
```

- **Confirmed Facts**:
  - File exists at path `X`.
  - File `A` imports Symbol `S` from File `B`.
  - Component `UserCard` renders child `<Avatar />`.
  - CSS variable `--primary` is defined as `#6366f1` in `src/globals.css`.
- **Heuristic Classifications**:
  - Module `src/features/billing` is classified as a "Domain Feature".
  - Component `src/components/common/Button.tsx` is classified as a "UI Primitive".
  - Architectural role of directory `src/lib/` is labeled as "Shared Utility Layer".

---

### 4.5. Component Explorer & Dependency Closure Algorithm

One of Codexel's primary innovations is the **Component Dependency Closure**:

```text
Target Component: Button.tsx
        │
        ├── Step 1: Scan local imports in Button.tsx
        │     ├── import { cn } from "@/lib/utils"          ──► Resolve to src/lib/utils.ts
        │     ├── import { buttonVariants } from "./theme"  ──► Resolve to src/components/theme.ts
        │     └── import { Slot } from "@radix-ui/react-slot" ──► External package
        │
        ├── Step 2: Recursively scan dependencies of resolved local files
        │     ├── src/lib/utils.ts imports 'clsx' and 'tailwind-merge'
        │     └── src/components/theme.ts imports 'cva'
        │
        └── Step 3: Compute Complete Closure Set
              ├── Local Files: [Button.tsx, src/components/theme.ts, src/lib/utils.ts]
              └── Required NPM Packages: ["@radix-ui/react-slot", "clsx", "tailwind-merge", "class-variance-authority"]
```

This enables the **"1-Click Copy Component Bundle"** feature, providing engineers with every local file and package dependency needed to port the component into their own codebase.

---

### 4.6. Design Intelligence Extraction

The analyzer parses styling systems into structured design tokens:

1. **CSS Variables & Themes**:
   - Parses standard CSS/SCSS root blocks (`:root`, `[data-theme='dark']`).
   - Resolves color codes (Hex, HSL, RGB, OKLCH).
2. **Tailwind CSS Configuration**:
   - Inspects `tailwind.config.*` (colors, font families, screens, spacing scales).
   - Scans component files to compile a frequency distribution of utility classes.
3. **Typographic & Spatial Scales**:
   - Normalizes font sizes, line heights, font weights, and border-radius tokens into a visual design system palette.

---

## 5. Data Model & Storage Strategy

### 5.1. Caching Strategy: SHA-Keyed Deduplication

Analysis is computationally intensive. To prevent repeated work, Codexel implements an immutable commit-based caching strategy:

```text
Cache Key = SHA256(RepoURL + CommitSHA + AnalyzerEngineVersion)
```

- When a user inputs `https://github.com/shadcn-ui/ui`, Codexel resolves `HEAD` -> `commit_sha_xyz`.
- If an analysis for `(https://github.com/shadcn-ui/ui, commit_sha_xyz, v1.0.0)` exists in the database, the stored Repository Model is returned instantly (< 150ms).

### 5.2. Database Schema (PostgreSQL + Drizzle ORM)

```text
┌───────────────────────┐
│     repositories      │
├───────────────────────┤
│ id (UUID, PK)         │
│ url (VARCHAR)         │
│ owner (VARCHAR)       │
│ name (VARCHAR)        │
│ default_branch        │
│ is_private (BOOLEAN)  │
│ created_at, updated_at│
└──────────┬────────────┘
           │ 1
           │
           │ N
┌──────────▼────────────┐
│      analyses         │
├───────────────────────┤
│ id (UUID, PK)         │
│ repository_id (FK)    │
│ commit_sha (VARCHAR)  │
│ status (ENUM)         │ ── (pending, analyzing, completed, failed)
│ analyzer_version      │
│ summary (JSONB)       │ ── High level metadata & tech stack
│ model_payload (JSONB) │ ── Full validated Repository Intelligence Model
│ stats (JSONB)         │ ── File count, component count, timing metrics
│ error_details (JSONB) │
│ created_at, updated_at│
└───────────────────────┘
```

> **Architecture Decision**: For the MVP, the complete verified Repository Model is persisted as a structured `model_payload (JSONB)` column in PostgreSQL, validated on save with Zod. This eliminates premature schema over-normalization across 15+ sub-tables while retaining full queryability via PostgreSQL JSONB operators.

---

## 6. Security, Privacy & Sandboxing Guidelines

1. **Static Analysis Only**: No dynamic code evaluation (`eval()`, `node <file>`, running webpack/vite dev servers) is permitted.
2. **Ephemeral File Workspaces**: Shallow-cloned repositories are created in isolated temporary directories (`/tmp/codexel/<uuid>`) on an ephemeral volume and securely erased immediately after AST generation.
3. **Strict Resource Constraints**:
   - Memory limit per worker job: 2 GB.
   - Max clone size: 150 MB.
   - Timeout: Hard process kill after 90 seconds.
4. **Environment Isolation**: Analysis workers run with stripped environment variables (no access to production DB credentials, API secrets, or internal network endpoints).

---

## 7. Interfaces & Consumption Models

Codexel’s architecture ensures the core analyzer is agnostic to how it is invoked:

1. **Web Explorer** (`apps/web`): Interactive Next.js canvas powered by React Flow for architecture mapping, combined with custom component and design inspectors.
2. **CLI Engine** (`packages/cli` - Future): Run `npx codexel analyze .` locally on private machines, generating an offline HTML report or streaming directly to a local browser session without uploading source code.
3. **Agent / AI Tool Hook** (Future): Exposes the Repository Model JSON via standard MCP (Model Context Protocol) or REST endpoints, allowing coding agents to explore repositories with 100% factual accuracy.

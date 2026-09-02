# Codexel — Implementation Roadmap & Phased Rollout

> **Guiding Principle**: Build the engine first. Prove deterministic code intelligence against real repositories before building complex UI or AI layers.

---

## 🎯 First Concrete Milestone

> ### **"Give Codexel a public GitHub URL and receive a verified, structured JSON Repository Model in under 30 seconds."**

```text
GitHub URL
    ↓
Ingestion Sandbox (Shallow Clone)
    ↓
Deterministic Scanner & Ignore Rules
    ↓
Technology & Manifest Detector
    ↓
AST & Symbol Parser
    ↓
Import & Component Relationship Analyzer
    ↓
Validated Repository Model (JSON)
```

Before building graphical UI views or AI layers, this pipeline must run reliably against real-world repositories (e.g., standard Next.js apps, Vite SPAs, fullstack monorepos, and component libraries).

---

## 🚫 Explicit Non-Goals for Early Phases

To maintain velocity and focus on core differentiation, the following items are intentionally excluded from early development:

- ❌ User authentication & user accounts (MVP uses anonymous public repo analysis).
- ❌ Private repository OAuth / billing / paywalls.
- ❌ Non-GitHub platforms (GitLab, Bitbucket, Azure DevOps).
- ❌ Multi-language polyglot analysis (TypeScript/JavaScript ecosystem is Phase 1–8 focus).
- ❌ Blind LLM parsing or ungrounded conversational chatbots.
- ❌ Dynamic runtime code execution or arbitrary package installation scripts.
- ❌ Complete AST transpilation / automatic code conversion between frameworks.

---

## 🗺️ Phased Implementation Schedule

```text
Foundations ──► Ingestion ──► Static Engine ──► Visual Explorers ──► Previews & Reuse ──► AI & CLI
 (Phase 0)       (Phase 1)     (Phase 2-3)       (Phase 4-6)           (Phase 7-8)       (Phase 9-11)
```

---

### Phase 0 — Project Foundation & Monorepo Setup (Completed)

- **Objective**: Establish a production-grade TypeScript monorepo with strict linting, shared packages, and database infrastructure.
- **Key Tasks**:
  - [x] Initialize monorepo workspace (`pnpm` workspaces + Turborepo).
  - [x] Scaffold `apps/web` (Next.js 15 App Router, Tailwind CSS, TypeScript).
  - [x] Scaffold `apps/worker` (Node.js TypeScript background worker, BullMQ).
  - [x] Scaffold `packages/analyzer` (Standalone TypeScript static analysis library).
  - [x] Scaffold `packages/shared` (Zod schemas, types, DTO contracts).
  - [x] Scaffold `packages/ui` (Shared design system primitives with Tailwind).
  - [x] Setup `database/` package with Drizzle ORM, migrations, and PostgreSQL connection pool.
  - [x] Configure CI pipelines (linting, typechecks, formatting).
- **Deliverable**: Web app loads, database migration runs cleanly, packages import across the monorepo without circular dependencies.

---

### Phase 1 — Repository Ingestion & Sandboxing (Completed)

- **Objective**: Safely receive, validate, shallow-clone, and isolate a public GitHub repository.
- **Key Tasks**:
  - [x] Implement GitHub URL parser and normalizer (handles branch/tag syntax).
  - [x] Implement remote commit SHA resolution (`git ls-remote`) for cache key generation.
  - [x] Build isolated shallow cloner (`git clone --depth 1`) in a secure ephemeral directory.
  - [x] Implement strict safety boundaries:
    - Max 10,000 files.
    - Max 150 MB repository size.
    - 60-second fetch timeout.
  - [x] Implement post-analysis guaranteed cleanup hooks (`rm -rf` temp sandboxes).
- **Deliverable**: Command / test harness that takes a GitHub URL, creates an ephemeral local clone, validates bounds, and purges the workspace on completion.

---

### Phase 2 — Basic Scanner & Technology Detector (Completed)

- **Objective**: Walk the local repository, filter irrelevant files, and deterministically identify toolchains and frameworks.
- **Key Tasks**:
  - [x] Build high-performance recursive directory scanner with configurable ignore engine (`.gitignore`, `node_modules`, `dist`, `.next`, `.git`, lockfiles).
  - [x] Compute repository file inventory and aggregate statistics (file counts, lines of code, extensions).
  - [x] Parse `package.json` manifests (dependencies, devDependencies, scripts).
  - [x] Implement deterministic framework detection rules:
    - React, Next.js, Vite, Remix, Astro, Vue.
    - Tailwind CSS, PostCSS, CSS Modules, Styled Components.
    - Drizzle, Prisma, Supabase, Mongoose.
    - Radix UI, shadcn/ui, MUI, Lucide icons.
- **Deliverable**: Given any cloned repo path, output a validated JSON summary of technologies, manifests, and file hierarchies.

---

### Phase 3 — Code Intelligence & AST Parsing (Completed)

- **Objective**: Parse JavaScript and TypeScript files into concrete symbol and import graphs.
- **Key Tasks**:
  - [x] Integrate TypeScript Compiler API / Babel parser for AST traversal.
  - [x] Extract file-level imports and exports (named, default, dynamic).
  - [x] Resolve module import paths against `tsconfig.json` path aliases (`@/*`).
  - [x] Build Directed Acyclic Graph (DAG) of file-to-file module dependencies.
  - [x] Detect React components (function and class components, exported JSX).
  - [x] Extract component metadata: name, line range, props interfaces, imported child components.
  - [x] Detect routing entry points (Next.js App router `page.tsx`/`layout.tsx`, Pages router, React Router).
- **Deliverable**: Complete code graph connecting every file and component with its imports and usages.

---

### Phase 4 — Architecture Explorer (Interactive Visualizer) (Completed)

- **Objective**: Create the primary visual overview of the codebase using interactive node-edge diagrams.
- **Key Tasks**:
  - [x] Integrate React Flow with custom styling and node layouts.
  - [x] Synthesize higher-level architectural nodes (UI layer, Feature domains, Server APIs, Data models).
  - [x] Render interactive module relationship graphs with pan, zoom, and minimap.
  - [x] Build filterable node views (e.g., "Show only API routes", "Show only components", "Filter by directory").
  - [x] Provide drawer/panel on node selection showing source file paths, imports, and dependents.
  - [x] Implement responsive canvas controls and dark mode theme.
- **Deliverable**: Interactive browser canvas visualizing the entire architecture of an analyzed GitHub repository.

---

### Phase 5 — Component Explorer & Source Viewer

- **Objective**: Present an automatically generated, searchable component library for the repository.
- **Key Tasks**:
  - [ ] Build catalog view grouping detected components by category (UI Primitives, Features, Layouts, Forms).
  - [ ] Render component detail card: name, source path, props list, child components.
  - [ ] Integrate code viewer with syntax highlighting (Shiki / Prism) showing exact component source.
  - [ ] Build component usage list ("Used by: `Header.tsx`, `Sidebar.tsx`").
  - [ ] Search and filter components by name, directory, and props.
- **Deliverable**: Searchable, categorised component inventory displaying verified source code and usage footprints.

---

### Phase 6 — Design System Intelligence

- **Objective**: Extract and display the design tokens and visual DNA of the application.
- **Key Tasks**:
  - [ ] Parse CSS variables (`:root`, `[data-theme='dark']`) for colors, radii, and fonts.
  - [ ] Inspect `tailwind.config.*` for custom color palettes, spacing rules, and typography.
  - [ ] Scan JSX/TSX files for top 50 recurring Tailwind utility classes.
  - [ ] Display visual color palette cards with copyable HEX/HSL values.
  - [ ] Display typography ladder (font families, weights, sizes).
  - [ ] Catalog detected UI libraries, icon packs, and animation libraries.
- **Deliverable**: Clean "Design System" view showcasing all detected tokens, colors, typography, and UI packages.

---

### Phase 7 — Isolated Component Preview

- **Objective**: Render supported frontend components in a safe, sandboxed preview environment.
- **Key Tasks**:
  - [ ] Research and implement sandboxed iframe rendering container.
  - [ ] Package component source alongside required styling into an isolated preview bundle.
  - [ ] Provide fallback placeholder when dynamic runtime dependencies prevent safe rendering.
  - [ ] Ensure strict CSP headers preventing any network requests or storage access from sandboxed components.
- **Deliverable**: Live visual rendering of standalone UI primitives inside a secure iframe.

---

### Phase 8 — Component Reuse & Dependency Closure

- **Objective**: Enable developers to copy a component together with all transitive local dependencies and packages.
- **Key Tasks**:
  - [ ] Implement Transitive Dependency Closure graph traversal:
    - Trace local module imports recursively from target component file.
    - Identify required local utility files (e.g., `utils.ts`, `theme.ts`, `buttonVariants.ts`).
  - [ ] Identify required npm packages and their minimum versions.
  - [ ] Build "Copy Component Bundle" modal:
    - View all bundled files with individual copy buttons.
    - View `npm install` command for required external dependencies.
    - Download zip bundle option.
- **Deliverable**: 1-click export of a component and its complete local dependency tree.

---

### Phase 9 — Grounded AI Layer

- **Objective**: Natural language query engine strictly grounded in the structured Repository Model.
- **Key Tasks**:
  - [ ] Implement prompt templates injecting only deterministic model facts (never raw unparsed source).
  - [ ] Features:
    - "Explain this repository architecture."
    - "Where is authentication or data fetching handled?"
    - "Summarize the design system and UI library choices."
    - "Generate onboarding guide for new engineers."
  - [ ] Enforce source attribution: AI responses must cite exact file paths and line ranges from the model.
- **Deliverable**: Conversational assistant that answers questions with zero hallucinations, backed by verified code facts.

---

### Phase 10 — Local Workspace & Drag-and-Drop Ingestion

- **Objective**: Support analyzing private or local repositories directly on the user's machine without GitHub.
- **Key Tasks**:
  - [ ] Add directory picker API (`window.showDirectoryPicker()`) and folder drag-and-drop.
  - [ ] Feed local directory path directly into the analyzer pipeline.
  - [ ] Ensure parity between GitHub clone results and local directory scan results.
- **Deliverable**: Users can drag a local project folder onto Codexel and explore it immediately.

---

### Phase 11 — Codexel CLI

- **Objective**: Command-line tool to analyze repositories locally in terminal environments.
- **Key Tasks**:
  - [ ] Create `packages/cli` binary (`codexel analyze .`).
  - [ ] Reuse `packages/analyzer` package directly.
  - [ ] Generate static standalone HTML report or launch local web viewer on `localhost:3800`.
- **Deliverable**: `npx codexel analyze .` executes in terminal and opens local interactive explorer.

---

## 📊 Summary of Phase Milestones & Status

| Phase  | Description           | Deliverable                                        | Status      |
| :----- | :-------------------- | :------------------------------------------------- | :---------- |
| **0**  | Project Foundation    | Monorepo, Next.js, Tailwind, Drizzle, Turborepo    | ✅ Complete |
| **1**  | Repo Ingestion        | GitHub URL cloner, sandbox isolation, cleanup      | ✅ Complete |
| **2**  | Basic Scanner         | Ignore engine, package detector, stats summary     | ✅ Complete |
| **3**  | Code Intelligence     | AST parsing, import graph, React component catalog | ✅ Complete |
| **4**  | Architecture Explorer | React Flow interactive graph canvas                | ✅ Complete |
| **5**  | Component Explorer    | Component inventory, source viewer, usage graph    | ⏳ Next     |
| **6**  | Design Intelligence   | Color swatches, CSS vars, Tailwind tokens          | 📅 Planned  |
| **7**  | Component Preview     | Sandboxed iframe preview                           | 📅 Planned  |
| **8**  | Component Reuse       | Dependency closure export ("Copy Component")       | 📅 Planned  |
| **9**  | Grounded AI Layer     | Fact-based Q&A without hallucinations              | 📅 Planned  |
| **10** | Local Workspaces      | Drag-and-drop local directory analysis             | 📅 Planned  |
| **11** | Codexel CLI           | `codexel analyze .` command-line utility           | 📅 Planned  |

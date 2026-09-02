# Codexel

<div align="center">

<h3>Turn any codebase into an explorable visual representation of its architecture, components, and design system.</h3>

<p>
  <strong>Understand, explore, and reuse any codebase visually — without reading thousands of lines of code or relying on outdated documentation.</strong>
</p>

---

</div>

## 🌟 The Vision

Developers spend a massive amount of time deciphering unfamiliar repositories. Documentation is often missing, stale, or incomplete, forcing engineers to manually trace imports, decipher project directory conventions, and reverse-engineer UI components.

**Codexel** solves this by transforming any Git repository into an interactive, visual, and structured intelligence platform:

- 🗺️ **Architecture Explorer** — Interactive graph visualization of boundaries, feature modules, API layers, and data flows.
- 🧩 **Component Explorer** — Automatically generated, cataloged inventory of UI components, their props, dependencies, and usages.
- 🎨 **Design Intelligence** — Extracted design systems, CSS variables, Tailwind tokens, color palettes, and typographic scales.
- 🔍 **Source Traceability** — Direct links and deep references from every node and component back to the verified source code.
- ⚡ **Component Dependency Closure** — Inspect and extract isolated components along with all required local files and dependencies.
- 🤖 **Grounded AI Assistant (Optional Layer)** — Ask questions about architecture and structure, grounded strictly in deterministic repository facts.

---

## 🧭 Core Philosophy: The Repository Is The Source of Truth

Codexel strictly rejects the pattern of feeding raw source code blindly into an LLM and hoping for factual answers. Large Language Models hallucinate file structures, invent nonexistent imports, and miss subtle dependencies.

Instead, Codexel is built on **Deterministic Analysis First**:

```text
Repository Source
       ↓
Deterministic Static Analysis (AST, TS Compiler API, Parsers)
       ↓
Structured, Versioned Repository Intelligence Model
       ↓
Interactive Visual Explorer (React Flow, Component Catalog, Design System)
       ↓
Optional Grounded AI Interpretation (Zero Hallucinations)
```

1. **Facts before AI**: If a fact (imports, routes, props, colors, dependencies) can be computed from code, it is deterministically extracted.
2. **Analyze, Never Execute**: Repositories are treated as untrusted input. Codexel parses syntax and ASTs; it never blindly executes arbitrary package scripts or code.
3. **Show Evidence**: Every relationship, node, or token links directly back to the exact file and line number in the repository.
4. **Single Engine, Multiple Interfaces**: The analysis engine is isolated in a modular package, designed to power the Web App, CLI (`codexel analyze .`), and future IDE integrations.

---

## 🏗️ Architecture

Codexel is built on a worker-based pipeline that deterministically parses codebases, extracts module boundaries and components, and stores structured metadata keyed by commit SHA.

For full technical specifications, pipeline details, caching strategy, and database schema, see [**System Architecture & Technical Specs**](./docs/ARCHITECTURE.md).

---

## 📦 Monorepo Structure

```text
codexel/
├── apps/
│   ├── web/                    # Next.js web application (Explorer, UI, Dashboard)
│   └── worker/                 # Asynchronous analysis worker (BullMQ consumer)
│
├── packages/
│   ├── analyzer/               # Core deterministic intelligence engine
│   │   ├── scanner/            # File system walker, glob & ignore filter
│   │   ├── parsers/            # TypeScript / JavaScript AST & CSS parsers
│   │   ├── detectors/          # Framework, runtime, and toolchain detectors
│   │   ├── architecture/       # Module boundaries & graph relationship builder
│   │   ├── components/         # React component inventory & hierarchy extractor
│   │   ├── design/             # Design tokens, CSS variables & Tailwind parser
│   │   └── model/              # Repository Model schemas & validation (Zod)
│   │
│   ├── shared/                 # Shared TypeScript interfaces, DTOs & utilities
│   └── ui/                     # Shared UI component primitives (Tailwind + Radix)
│
├── database/                   # PostgreSQL schema definitions, Drizzle ORM migrations
└── docs/                       # Specifications, architecture, and roadmap guides
```

---

## 🗺️ Documentation Index

Detailed architectural and planning documents are available in the [`docs/`](./docs) directory:

- 📐 [**System Architecture & Technical Specs**](./docs/ARCHITECTURE.md) — Comprehensive technical design, analysis pipeline, security sandboxing, caching strategy, and database schema.
- 🗺️ [**Development Roadmap & Milestones**](./docs/ROADMAP.md) — Phased rollout plan from Phase 0 (Foundation) to Milestone 1 and full production rollout.
- 📋 [**Repository Intelligence Model Specification**](./docs/REPOSITORY_MODEL.md) — Exact TypeScript type definitions and JSON schemas representing the core data contract.
- 🎨 [**Design System & UI Specification**](./docs/DESIGN_SYSTEM.md) — Light-first editorial design system, typography, and blueprint visual guidelines.

---

## 🔒 Security & Sandboxing Principles

Repositories represent untrusted third-party code. Codexel adheres to strict isolation rules:

- **Zero Arbitrary Execution**: Analysis relies on static AST parsing and filesystem inspection. `npm install`, build scripts, or code execution are prohibited during ingestion and analysis.
- **Resource Constraints**: Strict limits on repository file size, depth, total AST node count, and analysis timeouts to prevent denial-of-service.
- **Sandboxed Cleanup**: Ephemeral clone workspaces are cleaned up immediately following model extraction.
- **SHA-Based Caching**: Analyses are keyed by `(Repository URL + Commit SHA)` to eliminate duplicate compute while ensuring accurate reproducibility.

---

## 📄 License

Codexel is distributed under the MIT License. See [LICENSE](./LICENSE) for details.

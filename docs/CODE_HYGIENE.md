# Codexel — Engineering Code Hygiene & Architectural Standards

> **Guiding Principle**: Write optimal, maintainable, and industry-grade TypeScript. Never repeat code across packages or components. Enforce deterministic facts and automated CI verification for all changes.

---

## 🏛️ 1. Core Architectural Pillars

Codexel is designed to analyze real-world codebases with high precision. To maintain that level of deterministic rigor, our own codebase must adhere to the highest standard of engineering discipline.

### 1.1 The DRY (Don't Repeat Yourself) Mandate

- **Single Source of Truth (SSOT)**: Every schema, type contract, and data structure must have one definitive source in `@codexel/shared`.
- **Reusable Primitives**: UI components must never duplicate layout or button logic. Reusable primitives live in `@codexel/ui` or `components/explorer/`.
- **Centralized Logic**: Static analysis rules, AST visitors, and detector heuristics belong exclusively in `@codexel/analyzer`, never ad-hoc inside web route handlers.

### 1.2 Monorepo Package Topology (Directed Acyclic Graph)

The workspace follows strict dependency isolation:

```text
       ┌────────────────────────┐
       │     @codexel/shared    │ (Types, Zod Schemas, Contracts)
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │    @codexel/analyzer   │ (Deterministic AST Engine)
       └───────────┬────────────┘
                   │
       ┌───────────┴────────────────────────┐
       ▼                                    ▼
┌───────────────┐                  ┌──────────────────┐
│   apps/web    │ (Next.js 15 UI)  │   apps/worker    │ (BullMQ Worker)
└───────────────┘                  └──────────────────┘
```

- **Rule**: Circular dependencies between packages are strictly prohibited.
- **Rule**: Apps consume packages; packages do not import from apps.
- **Rule**: Internal package imports must use `@codexel/*` workspace aliases, never brittle relative paths (`../../..`).

---

## 🛡️ 2. Type Safety & TypeScript Standards

### 2.1 Strict Compiler Discipline

All packages inherit strict compiler options from `tsconfig.base.json`:

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUncheckedIndexedAccess: true`

### 2.2 Zod-Backed Contract Invariants

Every data boundary (API responses, analyzer outputs, database records) must be validated with Zod:

```typescript
// Good: Single source of truth with inferred type
export const ComponentPropSchema = z.object({
  name: z.string(),
  type: z.string(),
  isRequired: z.boolean(),
  defaultValue: z.string().optional(),
});

export type ComponentProp = z.infer<typeof ComponentPropSchema>;
```

### 2.3 Discriminated Unions Over Enums / Bare Strings

Use discriminated unions for domain variants to ensure exhaustive pattern matching:

```typescript
// Good: Exhaustive and safe
export type ComponentCategory =
  | "ui-primitive"
  | "shared-component"
  | "feature-component"
  | "page"
  | "layout"
  | "form"
  | "modal"
  | "navigation";
```

### 2.4 Prohibition of `any`

- Production code must never use the `any` escape hatch.
- Use `unknown` with type guards or proper TypeScript generics when the shape is not initially known.

---

## 🔍 3. Anti-Duplication & Copy-Paste Detection (`jscpd`)

To guarantee code is not repeated as the application grows across phases, Codexel runs automated copy-paste detection in CI via **`jscpd`**.

### 3.1 Thresholds & Bounds

- **Maximum Repository Duplication**: `< 3.0%`.
- **Minimum Token Threshold**: 50 tokens.
- **Minimum Line Threshold**: 5 lines.
- **Ignored Directories**: `node_modules`, `.next`, `dist`, `.turbo`, and test fixture directories.

### 3.2 Running the Duplication Check

```bash
# Run standalone copy-paste detection across packages and apps
pnpm run check:duplication
```

If duplicate logic is detected:

1. Extract the shared logic into a helper utility in `@codexel/shared` or `@codexel/analyzer`.
2. For UI duplication, extract a parameterized React component into `components/`.

---

## 🎨 4. Frontend & Component Engineering Hygiene

### 4.1 React 19 & Next.js 15 App Router Conventions

- **Client Boundaries**: Keep `"use client"` as low in the component tree as possible.
- **Deterministic Rendering**: Avoid non-deterministic values (random numbers, unseeded dates) during SSR render passes.
- **Component Purity**: Components should be pure functions with respect to props. Keep side-effects confined to `useEffect` or event handlers.

### 4.2 Design Token Consistency

- Avoid arbitrary hardcoded magic values (e.g., avoid `text-[#123456]` or `bg-[rgb(12,34,56)]`).
- Always consume standardized design tokens:
  - `bg-background`, `bg-surface`, `bg-surface-secondary`
  - `text-foreground`, `text-foreground-secondary`, `text-foreground-muted`
  - `border-border`, `border-border-strong`
  - `text-primary`, `bg-primary`

### 4.3 Accessible Interactivity

- Every interactive element (buttons, tabs, inputs) must include accessible ARIA roles, labels, and visible focus rings (`focus-visible:outline-none focus-visible:ring-1`).
- Icon buttons must provide a `title` attribute or visually hidden screen reader text.

---

## 📚 5. Documentation Hygiene & Integrity

Documentation is treated as a first-class production artifact:

### 5.1 Required Documents

- **`README.md`**: Monorepo overview, architecture diagram, and quickstart commands.
- **`docs/ROADMAP.md`**: Official phased implementation schedule and phase completion checkboxes.
- **`docs/CODE_HYGIENE.md`**: This engineering standard reference.

### 5.2 Documentation Linting (`check-docs.mjs`)

Every CI run executes `scripts/check-docs.mjs` to verify:

- Mandatory documents exist and are not empty stubs.
- Code blocks specify syntax highlighting language specifiers (e.g., ` ```typescript `, not bare ` ``` `).
- Relative file and URL links resolve to verified targets.

---

## ⚙️ 6. Automated CI Quality Gatekeeper Pipeline

Every pull request and push to `main` must pass the comprehensive 6-stage automated CI gatekeeper in `.github/workflows/ci.yml`:

| Stage                   | Command                      | Purpose                                                                  |
| :---------------------- | :--------------------------- | :----------------------------------------------------------------------- |
| **1. Formatting**       | `pnpm run format:check`      | Verifies Prettier styling across all code and documentation.             |
| **2. Typecheck**        | `pnpm run typecheck`         | Monorepo-wide strict TypeScript type verification across all 6 packages. |
| **3. Anti-Duplication** | `pnpm run check:duplication` | Executes `jscpd` to prevent copy-paste code repetition.                  |
| **4. Doc Integrity**    | `pnpm run check:docs`        | Verifies documentation completeness and hygiene.                         |
| **5. Unit Tests**       | `pnpm run test`              | Executes Vitest unit and integration test suites.                        |
| **6. Production Build** | `pnpm run build`             | Compiles production bundles for web and workers.                         |

### 6.1 One-Command Local Verification

Developers can run the full hygiene verification suite locally before committing:

```bash
# Run all formatting, duplication, and documentation checks
pnpm run check:hygiene

# Run the complete test and typecheck pipeline
pnpm typecheck && pnpm test
```

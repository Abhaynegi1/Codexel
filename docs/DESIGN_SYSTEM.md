# Codexel — Design System & UI Specification

> **Core Aesthetic**: Light-first · Editorial · Technical · Precise · Visual · Minimal · Developer-Focused  
> **Brand Mark**: `◇ codexel`  
> **Visual Identity**: Technical documentation + Architecture blueprint + Modern developer workspace

---

## 1. Design Direction & Philosophy

Codexel is built as a **visual developer workspace**, not a generic SaaS dashboard or AI wrapper.

- **Light-first**: Subtle paper/editorial warm off-white background (`#F8F7F3`).
- **Technical & Precise**: Structured panels, crisp 1px borders, subtle dot matrix grid.
- **Restrained Amber/Orange Accent**: `#F59E0B` used purposefully for CTAs, active selections, and focus highlights.
- **Semantic Colors**: Color is reserved for meaning (Frontend = Blue, API/Backend = Green, Auth = Purple, DB = Orange, External = Teal).
- **Codebase is the Hero**: The visual intrigue comes from real repository architecture, real components, and real design tokens — not artificial UI clutter or giant gradients.

---

## 2. Color System

### 2.1. Neutral Surface & Text Palette

| Token               | Hex       | Role                                          |
| :------------------ | :-------- | :-------------------------------------------- |
| `Background`        | `#F8F7F3` | Main canvas, warm editorial paper tone        |
| `Surface`           | `#FFFFFF` | Primary cards, panels, node bodies            |
| `Surface Secondary` | `#F3F2EE` | Sidebar, secondary containers, code blocks    |
| `Border`            | `#E5E2DA` | Standard thin structural dividers (1px solid) |
| `Border Strong`     | `#D5D1C8` | Active borders, hover states, node borders    |
| `Text Primary`      | `#171717` | Headlines, primary labels, component titles   |
| `Text Secondary`    | `#5F5C56` | Body text, descriptions, path breadcrumbs     |
| `Text Muted`        | `#8B8881` | Technical metadata, counts, placeholders      |

### 2.2. Brand Accent (Warm Amber / Orange)

| Token           | Hex       | Role                                                     |
| :-------------- | :-------- | :------------------------------------------------------- |
| `Primary`       | `#F59E0B` | Primary CTAs, active tab indicator, selected node border |
| `Primary Hover` | `#D97706` | Hover state for interactive primary actions              |
| `Primary Soft`  | `#FEF3C7` | Soft background badge for active node or selection       |
| `Primary Dark`  | `#B45309` | High-contrast text on primary soft backgrounds           |

### 2.3. Semantic Hierarchy (Architecture & Categories)

| Category                | Hex       | Meaning / Role                                     |
| :---------------------- | :-------- | :------------------------------------------------- |
| **Application / Root**  | `#F59E0B` | App entry points, root modules                     |
| **Frontend / UI**       | `#3B82F6` | Pages, layouts, UI components, client features     |
| **Backend / API**       | `#22C55E` | Server routes, API endpoints, microservices        |
| **Database / Storage**  | `#F59E0B` | ORM schemas, database models, storage clients      |
| **Authentication**      | `#8B5CF6` | Auth middleware, session providers, token handlers |
| **External Service**    | `#14B8A6` | Third-party SDKs, Stripe, payment, analytics       |
| **Error / Destructive** | `#EF4444` | Failures, breaking dependencies, alerts            |

---

## 3. Typography

- **UI Sans-Serif**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
- **Code & Technical Data**: `JetBrains Mono`, `ui-monospace`, `monospace`

### Typographic Scale

| Level                 | Size        | Weight | Line Height | Role                             |
| :-------------------- | :---------- | :----- | :---------- | :------------------------------- |
| **Hero**              | `56px–64px` | `700`  | `1.05`      | Main landing headline            |
| **Hero Mobile**       | `38px–42px` | `700`  | `1.1`       | Mobile headline                  |
| **Page Title**        | `28px–32px` | `600`  | `1.15`      | Section / View headline          |
| **Section Title**     | `20px–24px` | `600`  | `1.2`       | Feature headers, explorer views  |
| **Card Title**        | `15px–16px` | `600`  | `1.3`       | Node titles, component cards     |
| **Body**              | `14px–15px` | `400`  | `1.5`       | Descriptions, panel text         |
| **Metadata / Badges** | `12px–13px` | `500`  | `1.4`       | File counts, timings, tags       |
| **Code / Paths**      | `13px–14px` | `400`  | `1.5`       | Code snippets, file paths, props |

---

## 4. Spacing, Borders & Radius

- **Radius Scale**:
  - `sm`: `6px` (badges, small buttons, tags)
  - `md`: `8px` (standard buttons, input fields, architecture nodes)
  - `lg`: `12px` (panels, cards, code previews)
  - `dialog`: `14px` (modals, drawers)
- **Borders**: Thin, crisp `1px solid #E5E2DA`.
- **Shadows**: Extremely subtle. No heavy dropshadows or floating blurry glows. Structured panels rely on border contrast and background layering.
- **Grid Texture**: Delicate blueprint dot-matrix (`· · · ·`) on canvas backgrounds.

---

## 5. Visual Language & Signature Elements

```text
               CODEBASE
                  │
                  ▼
              STRUCTURE
                  │
                  ▼
             VISUAL MAP
                  │
                  ▼
               EXPLORE
                  │
                  ▼
              UNDERSTAND
                  │
                  ▼
                REUSE
```

- **Logo Mark**: `◇ codexel` (diamond glyph with subtle amber accent).
- **Architecture Blueprints**: Clean rectangular nodes with thin borders, semantic category badges, and directional connecting paths.
- **Component Catalog**: Generates a live component library feel (Preview, Variants, Props, Usage, Dependencies, Source).
- **1-Click Component Closure**: Traces transitive local files (`Button.tsx` + `theme.ts` + `utils.ts`) alongside required npm packages.

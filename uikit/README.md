# Faiz UI (some-ui)

A TanStack Start design system starter with shadcn/ui, a Faiz-branded marketing landing page, and a living component catalog at `/ui-kit`. Built on React 19, Tailwind CSS v4, and Geist Variable — with semantic design tokens for color, spacing, motion, shadows, logo, and typography.

## Tech stack

- **Framework** — TanStack Start + TanStack Router (file-based routes)
- **UI** — React 19, TypeScript, Vite 8, Bun
- **Styling** — Tailwind CSS v4, shadcn/ui (`base-luma` style, Hugeicons)
- **Motion & themes** — Motion, next-themes
- **Fonts** — Geist Variable (`@fontsource-variable/geist`)
- **Utilities** — date-fns, class-variance-authority, tailwind-merge
- **Linting & formatting** — [Biome](https://biomejs.dev) (`@biomejs/biome` 2.5.1)

## Getting started

```bash
bun install
bun run dev        # http://localhost:3000
bun run build
bun run preview
bun run typecheck
bun run check        # biome lint + format check
bun run fix          # biome auto-fix + format
bun run lint         # biome lint only
bun run format       # biome format only
bun run test
```

### Biome (lint, format, import sort)

Configured in [`biome.json`](biome.json). Migrated from Prettier via `biome migrate prettier --write`. ESLint was removed manually — `biome migrate eslint` fails because `@tanstack/eslint-config` uses a deprecated `@stylistic/eslint-plugin` preset; equivalent rules use Biome `recommended` plus the same opt-outs from the old `eslint.config.js`.

```bash
bun run check        # lint + format check (CI)
bun run fix          # fix safe issues + format
bun run lint         # lint only
bun run format       # format only
```

**Config highlights:**

| Setting | Value |
| ------- | ----- |
| VCS | Git enabled, respects `.gitignore` |
| Formatter | 2 spaces, LF, width 80, semicolons as needed, double quotes |
| Linter | `recommended` preset |
| Assist | Organize imports |
| Ignore | `dist/`, `routeTree.gen.ts` (generated) |

Install the [Biome editor extension](https://biomejs.dev/editors/first-party-extensions/) for format-on-save.

> **Note:** Prettier's `prettier-plugin-tailwindcss` (class sorting) has no Biome equivalent — Tailwind class order is no longer auto-sorted on format.

## Routes


| Route     | File                    | Description                              |
| --------- | ----------------------- | ---------------------------------------- |
| `/`       | `src/routes/index.tsx`  | Landing page: Header, Hero, LogosSection |
| `/ui-kit` | `src/routes/ui-kit.tsx` | Full component and design token catalog  |


## Project structure

```
src/
├── routes/              # TanStack file routes
├── components/
│   ├── ui/              # shadcn primitives (~50 components)
│   ├── ui-kit/          # Catalog page (catalog.ts, sections/, sidebar)
│   ├── header.tsx       # App marketing blocks
│   ├── hero.tsx
│   ├── logos-section.tsx
│   └── ...
├── styles.css           # Design tokens + semantic typography utilities
└── lib/utils.ts
biome.json               # Biome lint, format, import sort
```

## Design system

Tokens live in `[src/styles.css](src/styles.css)`. Preview them interactively at `/ui-kit` under **Design Tokens**.

## Adding shadcn components

```bash
bunx shadcn@latest add button
```

Components are placed in `src/components/ui/`. Import them as:

```tsx
import { Button } from "@/components/ui/button"
```

Configuration is in `[components.json](components.json)`:

- **Style** — `base-luma`
- **Icons** — Hugeicons
- **CSS** — `src/styles.css`

Optional registries (`@tailark`, `@efferd`, `@shadcnblocks`) require environment tokens if used — see `registries` in `components.json`.

After adding a component, update the UI kit (see above).

## Development tools


| Tool                  | When     | Location                                        |
| --------------------- | -------- | ----------------------------------------------- |
| **Biome**             | Dev/CI   | `biome.json` — lint, format, organize imports   |
| **Agentation**        | Dev only | `src/routes/__root.tsx` — UI annotation overlay |
| **TanStack Devtools** | Dev only | Router panel, bottom-left                       |


Agentation is a `devDependency` and is stripped from production builds via `import.meta.env.DEV`.

## AI agent conventions

`[AGENTS.md](AGENTS.md)` defines rules for Cursor and other agents working in this repo


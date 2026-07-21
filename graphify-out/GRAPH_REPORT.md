# Graph Report - .  (2026-07-21)

## Corpus Check
- Corpus is ~20,395 words - fits in a single context window. You may not need a graph.

## Summary
- 219 nodes · 297 edges · 19 communities (13 shown, 6 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Authentication & Database|Authentication & Database]]
- [[_COMMUNITY_Biome Linting & Actions|Biome Linting & Actions]]
- [[_COMMUNITY_Project Planning & Roadmap|Project Planning & Roadmap]]
- [[_COMMUNITY_Routes & Navigation|Routes & Navigation]]
- [[_COMMUNITY_Package Configuration|Package Configuration]]
- [[_COMMUNITY_UI Components & Auth Client|UI Components & Auth Client]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Core Dependencies|Core Dependencies]]
- [[_COMMUNITY_Product Design Requirements|Product Design Requirements]]
- [[_COMMUNITY_Design System & Theming|Design System & Theming]]
- [[_COMMUNITY_OpenFrame Feature Specs|OpenFrame Feature Specs]]
- [[_COMMUNITY_Better Auth PRD|Better Auth PRD]]
- [[_COMMUNITY_Biome PRD|Biome PRD]]
- [[_COMMUNITY_File Storage PRD|File Storage PRD]]
- [[_COMMUNITY_PostgreSQL PRD|PostgreSQL PRD]]
- [[_COMMUNITY_Tailwind CSS PRD|Tailwind CSS PRD]]
- [[_COMMUNITY_TanStack Start PRD|TanStack Start PRD]]

## God Nodes (most connected - your core abstractions)
1. `OpenFrame Fase 0-1 Implementation Plan` - 17 edges
2. `compilerOptions` - 16 edges
3. `scripts` - 9 edges
4. `FileRoutesByPath` - 7 edges
5. `Better Auth (Plan)` - 7 edges
6. `pesanError()` - 6 edges
7. `User Table Schema (Plan)` - 6 edges
8. `OpenFrame Rewrite Design Spec` - 6 edges
9. `Campaigns Table` - 6 edges
10. `Frame Slots Table` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Client-Side Compositing` --conceptually_related_to--> `Sharp`  [INFERRED]
  docs/superpowers/specs/2026-07-20-openframe-rewrite-design.md → PRD.md
- `OpenFrame Fase 0-1 Implementation Plan` --references--> `OpenFrame`  [EXTRACTED]
  docs/superpowers/plans/2026-07-20-openframe-fase-0-1-fondasi-dan-auth.md → PRD.md
- `OpenFrame Rewrite Design Spec` --references--> `Multi-Slot Twibbon`  [EXTRACTED]
  docs/superpowers/specs/2026-07-20-openframe-rewrite-design.md → PRD.md
- `Area Editor (Creator Canvas)` --references--> `Creator Persona`  [EXTRACTED]
  docs/superpowers/specs/2026-07-20-openframe-rewrite-design.md → PRD.md
- `Slot Filler (Participant Canvas)` --references--> `Participant Persona`  [EXTRACTED]
  docs/superpowers/specs/2026-07-20-openframe-rewrite-design.md → PRD.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Core Design Principles (P1-P4)** — spec_privacy_principle, spec_single_coordinate_principle, spec_single_compositing_principle, spec_yagni_principle [EXTRACTED 1.00]
- **Compositing Architecture** — spec_composite_pipeline, spec_client_compositing, spec_slot_filler, spec_geometry_module, spec_single_compositing_principle [INFERRED 0.85]
- **Canvas Editing Architecture (Creator + Participant)** — spec_area_editor, spec_slot_filler, spec_geometry_module, spec_relative_coordinates, spec_single_coordinate_principle [INFERRED 0.85]

## Communities (19 total, 6 thin omitted)

### Community 0 - "Authentication & Database"
Cohesion: 0.13
Nodes (18): client, db, account, session, user, verification, auth, generateRecoveryCode() (+10 more)

### Community 1 - "Biome Linting & Actions"
Cohesion: 0.07
Nodes (26): source, assist, actions, css, parser, files, ignoreUnknown, includes (+18 more)

### Community 2 - "Project Planning & Roadmap"
Cohesion: 0.13
Nodes (27): Better Auth (Plan), @better-auth/drizzle-adapter, Error Message Translation, OpenFrame Fase 0-1 Implementation Plan, Recovery Code Module (Plan), Session Table Schema (Plan), Slug Generation, Synthetic Email Pattern (+19 more)

### Community 3 - "Routes & Navigation"
Cohesion: 0.11
Nodes (20): Route, Route, Route, getTheme, Route, getRouter(), ApiAuthSplatRoute, DashboardRoute (+12 more)

### Community 4 - "Package Configuration"
Cohesion: 0.08
Nodes (23): devDependencies, @biomejs/biome, drizzle-kit, tailwindcss, @tailwindcss/vite, @types/bun, @types/react, @types/react-dom (+15 more)

### Community 5 - "UI Components & Auth Client"
Cohesion: 0.17
Nodes (10): Theme, ThemeToggle(), authClient, PADANAN, pesanError(), pesanZod(), Route, Route (+2 more)

### Community 6 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, baseUrl, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution (+10 more)

### Community 7 - "Core Dependencies"
Cohesion: 0.15
Nodes (13): dependencies, better-auth, @better-auth/drizzle-adapter, drizzle-orm, @fontsource-variable/bricolage-grotesque, @fontsource-variable/nunito, postgres, react (+5 more)

### Community 8 - "Product Design Requirements"
Cohesion: 0.22
Nodes (13): Apple Design Principles, Creator Persona, Participant Persona, Sharp, Fabric.js, Area Editor (Creator Canvas), Client-Side Compositing, Composite Rendering Pipeline (+5 more)

### Community 9 - "Design System & Theming"
Cohesion: 0.25
Nodes (8): Dark Theme, Accent #CAFF33, Bricolage Grotesque (Display Font), Nunito (Body Font), Light Theme, Tailwind CSS v4 Tokens, Theme Toggle, Design System Tokens (Spec)

### Community 10 - "OpenFrame Feature Specs"
Cohesion: 0.38
Nodes (7): Multi-Slot Twibbon, OpenFrame, OpenFrame (README), Tech Stack Summary, Setup Rewrite Prompt, OpenFrame Rewrite Design Spec, Vite and Bun Split

## Knowledge Gaps
- **108 isolated node(s):** `$schema`, `includes`, `ignoreUnknown`, `enabled`, `indentStyle` (+103 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OpenFrame Fase 0-1 Implementation Plan` connect `Project Planning & Roadmap` to `Design System & Theming`, `OpenFrame Feature Specs`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Core Dependencies` to `Package Configuration`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `$schema`, `includes`, `ignoreUnknown` to the rest of the system?**
  _110 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication & Database` be split into smaller, more focused modules?**
  _Cohesion score 0.13105413105413105 - nodes in this community are weakly interconnected._
- **Should `Biome Linting & Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Project Planning & Roadmap` be split into smaller, more focused modules?**
  _Cohesion score 0.1339031339031339 - nodes in this community are weakly interconnected._
- **Should `Routes & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.1076923076923077 - nodes in this community are weakly interconnected._
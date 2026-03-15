# Codex Arcanum Roadmap

Codex Arcanum is the target product direction for this repository: a D&D 5e character sheet manager with GM session hosting, Supabase-backed persistence, expanded compendium tooling, and settlement management.

## Baseline

The requested roadmap was written for `React 18 + TypeScript + Vite + Zustand + Zod + Open5e + Supabase`.

The current repository baseline is already on newer tooling:

- React 19
- React Router 7
- Vite 8
- pnpm 10

Future implementation should adapt the roadmap to the current stack unless there is an explicit decision to downgrade.

## Product Direction

- Supabase-backed persistence is the preferred mode when configured.
- The local fallback layer must remain safe and usable when Supabase is unavailable.
- Character editing, homebrew, inventory, forms, and GM controls all stay inside one unified admin-style workspace.
- Every persisted structure must stay Zod-validated and migration-backed.

## Phase 1 - Foundation

- Harden project scaffold, CI/CD, environment handling, persistence, and migrations.
- Build the full multi-step character wizard.
- Complete the editable character sheet sections for stats, combat, spells, inventory, features, and notes.
- Add multi-character management, import/export, and Open5e-backed compendium browsing.
- Cover migrations, schemas, and core math with unit tests.

## Phase 2 - GM Mode and Sessions

- Stand up Supabase auth, tables, RLS policies, and snapshot sync.
- Add universal game creation so any authenticated user can host.
- Implement username and link invites with separate player and co-GM flows.
- Build permission resolution, permission editing UI, and GM character editing.
- Add Realtime sync and a session log.

## Phase 3 - Inventory and Reveals

- Expand item and container schemas for nested inventory.
- Add drag-and-drop item movement and capacity tracking.
- Introduce locked containers, hidden contents, cursed items, unidentified items, and GM reveal controls.
- Build GM-applied curses, reveal levels, and a reveal queue.

## Phase 4 - Companions and Forms

- Add companions and forms as a first-class tab set.
- Implement familiars, pets, followers, wild shape, and polymorph overlays.
- Persist all companion and transformation data under character-owned state.
- Sync active overlays and GM-facing controls cleanly with the rest of the character pipeline.

## Phase 5 - Compendium Expansion

- Convert the compendium into a detachable floating panel with search, history, and pinning.
- Support drag-and-drop from compendium entries into the sheet.
- Add full homebrew authoring for spells, equipment, magic items, classes, races, backgrounds, feats, conditions, languages, proficiencies, monsters, and encounter templates.
- Publish settlements and other GM-curated content into a player-filtered compendium surface.

## Phase 6 - Settlement Manager

- Add a dedicated settlement route with a 13-section management experience.
- Cover overview, demographics, economy, government, religion, locations, map pins, NPCs, factions, jobs, events, timeline, and lore.
- Support multiple settlements, export/import, and compendium publication.

## Phase 7 - Polish and Infrastructure

- Migrate persistence from localStorage to IndexedDB.
- Add PWA/offline support, Playwright coverage, accessibility audits, and mobile adaptations.
- Improve performance with route splitting, virtualization, bundle budgets, and Lighthouse CI.
- Expand snapshot tooling, print/PDF output, Storybook coverage, and homebrew pack sharing.

## Cross-Cutting Constraints

- TypeScript strict mode remains enforced.
- Zustand state stays slice-based and explicit.
- Persisted writes must pass Zod validation.
- Every persisted shape change requires a migration entry and migration tests.
- GM-only data must never leak into player-facing realtime payloads.
- Supabase-backed features must fail safely when environment variables are absent.
- Undo support is required for editing-heavy workflows.
- Large lists should be virtualized.
- Every async path needs explicit loading and error handling.

## Current Execution Focus

The current implemented focus after this pass is:

1. Converting the shell into an admin dashboard layout.
2. Keeping the Supabase-primary workflow stable on the current React 19 / pnpm toolchain.
3. Using this document as the tracked build spec for the remaining Codex Arcanum phases.

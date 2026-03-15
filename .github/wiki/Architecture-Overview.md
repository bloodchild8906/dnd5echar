# Architecture Overview

Codex Arcanum is built as a React application with Supabase-primary persistence, localStorage fallback, Open5e reference integration, and a dashboard-oriented route shell.

## Core Principles

### Supabase-first persistence

- When configured, Supabase is the preferred source for persisted workspace state.
- The app attempts a remote bootstrap before rendering the main workspace.
- Local storage is retained as the fallback cache and offline recovery layer.

### Fallback-safe operation

- Missing or broken Supabase configuration must not block local editing.
- Imported and restored data is still validated and migration-backed.
- The local fallback layer remains available for archive, recovery, and offline use.

### Admin-dashboard workflow

- `AppShell` provides a command-center style layout.
- Character work is split into focused routes instead of a single oversized page.
- Route modules are lazy-loaded so the initial app load stays smaller.

## Current Data Flow

```text
App bootstrap
  -> Supabase session + remote pull attempt
  -> Zustand store hydration
  -> localStorage fallback persistence
  -> ongoing Supabase replication
```

## State Shape

The app uses a single Zustand store composed from slices in `src/store/slices`:

- core
- characters
- spells
- inventory
- companions
- wild shapes
- notes
- homebrew
- settings
- UI preferences
- reference cache

Persisted app data is selected through `selectPersistedAppData`, written to the local fallback layer through `storageService`, and replicated through the Supabase sync service.

## Main Layers

| Layer            | Current Responsibility                         |
| ---------------- | ---------------------------------------------- |
| `src/app`        | Router and application entry                   |
| `src/components` | Shared UI primitives and layout                |
| `src/domain`     | Models, schemas, seeds, derived rules math     |
| `src/features`   | Route-focused screens and workflows            |
| `src/hooks`      | Bootstrap and data hooks                       |
| `src/services`   | Persistence, Open5e, and Supabase integrations |
| `src/store`      | Zustand store assembly and slice actions       |
| `src/styles`     | Global and print styling                       |

## Routing

The router currently exposes:

- dashboard
- auth
- games
- GM screen
- homebrew
- settings
- archive
- character builder
- character sheet
- spells
- inventory
- companions
- forms
- notes

Each feature route is lazy-loaded and wrapped in a loading boundary.

## Persistence and Migrations

- `useSupabaseAutoSync` attempts to bootstrap from Supabase first when configured.
- `storageService` still loads, saves, exports, imports, merges, backs up, and restores persisted bundles.
- `migrations.ts` upgrades older stored payloads before the app uses them.
- Zod schemas validate imported and restored data before it becomes active state.

## Data Model

See [[Data Model ERD]] for Mermaid ERD diagrams covering both the in-app model and the Supabase storage model.

## Reference Data

Open5e powers SRD-style reference lookups for classes, races, backgrounds, spells, and other compendium data. Responses are cached locally so the app can keep functioning when the network is unavailable.

## Current Performance Posture

- route-level code splitting
- size-limit checks in the build pipeline
- local caching for reference data
- debounced Supabase replication with a local fallback layer

## Related Pages

- [[Development Setup]]
- [[Data Model ERD]]
- [[Roadmap]]

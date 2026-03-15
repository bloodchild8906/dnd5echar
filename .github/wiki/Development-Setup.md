# Development Setup

This page describes the current local development workflow for Codex Arcanum.

## Requirements

- Node.js 20.19.0 or newer
- pnpm 10.32.1 or newer

## Quick Start

```bash
git clone https://github.com/Bloodchild8906/dnd5echar.git
cd dnd5echar
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

The dev server runs at `http://localhost:5173`.

## Environment Modes

### Local fallback mode

Leave `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` empty.

### Supabase-enabled mode

1. Create a Supabase project.
2. Enable Anonymous Sign-Ins.
3. Apply `supabase/migrations/202603140001_create_app_snapshots.sql`.
4. Fill the Supabase variables in `.env.local`.

## Important Scripts

| Command              | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `pnpm dev`           | Start the local dev server                      |
| `pnpm dev:staging`   | Start the app with `.env.staging`               |
| `pnpm type-check`    | Run TypeScript validation                       |
| `pnpm lint`          | Run ESLint                                      |
| `pnpm format`        | Format files with Prettier                      |
| `pnpm test`          | Run Vitest once                                 |
| `pnpm build`         | Run the full validation and production pipeline |
| `pnpm build:only`    | Build production assets only                    |
| `pnpm build:analyze` | Generate an analyzed build                      |
| `pnpm size`          | Run size-limit locally                          |

## Project Layout

```text
src/
  app/           App entry, router, and top-level wiring
  components/    Shared UI and layout components
  context/       Auth and provider context
  domain/        Models, schemas, seeds, and derived game math
  features/      Route-owned screens and workflows
  hooks/         App and data hooks
  services/      Open5e, storage, and Supabase services
  store/         Zustand store and slices
  styles/        Global and print styles
```

## Current Frontend Shape

- `AppShell` provides the admin dashboard layout.
- Route modules are lazy-loaded from `src/app/router.tsx`.
- The character builder is a multi-step wizard under `features/characters`.
- Shared state lives in one Zustand store composed from named slices.

## Validation Workflow

Before shipping a change, run:

```bash
pnpm build
```

That command covers:

- type-check
- lint
- format check
- tests
- production build
- size-limit output

## Debugging Notes

- Use browser DevTools Application tab to inspect local storage.
- Use React DevTools for component and hook state.
- If Supabase is configured, the app will attempt a remote bootstrap before falling back locally.

## Related Pages

- [[Architecture Overview]]
- [[Environment Variables]]
- [[Roadmap]]

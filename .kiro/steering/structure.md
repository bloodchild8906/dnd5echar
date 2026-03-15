# Project Structure

## Top-Level

```
src/
  app/          Router and app entry (App.tsx, router.tsx)
  components/   Shared UI primitives (common/, layout/)
  config/       Env config — use appEnv from env.ts, never import.meta.env directly
  context/      React context providers (AuthContext)
  domain/       Core types, derived math, schemas, seeds
  features/     Route-level page components
  hooks/        Custom hooks (store access, service integration)
  services/     External integrations (open5e, storage, supabase)
  store/        Zustand store and slices
  styles/       global.css, print.css
  utils/        Pure utility functions
```

## Key Conventions

### Domain layer (`src/domain/`)
- `models.ts` — all TypeScript interfaces and `as const` union arrays; derive types from arrays with `(typeof x)[number]`
- `derived.ts` — pure functions for computed character stats (AC, modifiers, spell DC, etc.); no side effects
- `schemas.ts` — Zod schemas mirroring models for runtime validation
- `seeds.ts` — factory functions (`createBlankCharacter`, `createSeedPersistedAppData`)
- Never import store or services into domain files

### Store (`src/store/`)
- Single `useAppStore` created with `zustand/create`
- Split into slices via `StateCreator<AppStore, [], [], SliceType>` pattern
- Each slice file exports one `createXxxSlice` function
- Slice interfaces defined in `store/types.ts`; `AppStore` is the intersection of all slices + `PersistedAppData`
- Store auto-persists to localStorage on every state change via a `subscribe` call in `useAppStore.ts`
- Use updater functions (not direct mutation) in all slice actions: `updateById`, `removeById`, `touchCharacter` helpers in `store/helpers.ts`

### Features (`src/features/`)
- One folder per route; each exports a single `XxxPage` component
- All routes are lazy-loaded via `React.lazy` in `router.tsx`
- Pages consume `useAppStore` and `useCurrentCharacter` hook; delegate rendering to `src/components/`

### Components (`src/components/`)
- `common/` — reusable domain-aware components (AbilityScoreGrid, CombatBlock, etc.)
- `layout/` — shell and navigation components
- Props interfaces defined inline in the same file
- Use CSS class names from `global.css` — no CSS modules or CSS-in-JS

### Services (`src/services/`)
- `storage/` — `storageService` object with load/save/export/import/backup methods; versioned keys in `keys.ts`; migrations in `migrations.ts`
- `supabase/` — auth, sync, and collaboration services; always guard with `hasSupabaseConfig()`
- `open5e/` — HTTP client and response normalizers for Open5e API

### Styling
- All styles live in `src/styles/global.css` as BEM-ish utility classes
- Design tokens via CSS custom properties on `:root` (`--bg`, `--accent`, `--ink`, `--panel`, `--radius`, etc.)
- Dark theme only; teal accent (`--accent: #33cbbf`)
- No Tailwind, no CSS modules, no styled-components

### Testing
- Test files co-located with source: `foo.test.ts` next to `foo.ts`
- Property-based tests use `fast-check` (`fc.assert`, `fc.property`)
- Use `createBlankCharacter()` from seeds as the base fixture in tests
- Run with `pnpm test` (single run); never use watch mode in CI or automated contexts

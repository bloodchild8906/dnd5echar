# Tech Stack

## Core

- React 19, TypeScript (strict mode)
- Vite 8 (bundler)
- React Router 7 (client-side routing, lazy-loaded routes)
- Zustand 5 (state management, slice pattern)
- Zod 4 (runtime schema validation)
- pnpm 10 (package manager)

## Backend / Persistence

- Supabase (`@supabase/supabase-js`) — primary persistence and auth when env vars are set
- localStorage — always-available fallback and offline cache
- Storage version key: `dnd5echar:app:v3`

## Testing

- Vitest 4 — unit and property-based tests
- fast-check 4 — property-based testing (PBT); used extensively in `domain/derived.test.ts`
- @testing-library/react — component tests
- msw 2 — API mocking

## Code Quality

- ESLint 10 with TypeScript, import, jsx-a11y, react-hooks plugins; zero warnings allowed
- Prettier (semi, singleQuote, tabWidth 2, trailingComma es5, printWidth 100)
- Husky + lint-staged (pre-commit: eslint + prettier on staged files)
- Commitlint with conventional commits (sentence-case subject)
- size-limit: 250 kB JS / 20 kB CSS (gzip)

## Environment Variables

All env vars are prefixed `VITE_`. Access via `src/config/env.ts` (`appEnv` object), never `import.meta.env` directly.

- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — enables Supabase persistence
- `VITE_APP_NAME`, `VITE_APP_ENV`, `VITE_DEFAULT_OPEN5E_DOCUMENT`

## Common Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server on port 5173 |
| `pnpm test` | Run Vitest once (use this, not watch mode) |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm type-check` | TypeScript check without emit |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm build` | Full pipeline: type-check → lint → format:check → test → build → size |
| `pnpm build:only` | Production build only |
| `pnpm scaffold` | Plop code generator |

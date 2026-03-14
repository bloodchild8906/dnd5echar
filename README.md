# D&D 5e Character Sheet Manager

Client-side React + TypeScript app for building and running D&D 5e characters with local-first persistence, optional Supabase sync, and Open5e reference browsing.

## Stack

- React + Vite + TypeScript
- Zustand state management
- Zod validation
- Open5e reference client with local cache
- localStorage persistence with migrations and backups
- Optional Supabase remote snapshot sync
- GitHub Actions CI + Vercel deployment

## Local setup

1. Install dependencies.
   `npm install`
2. Copy `.env.example` to `.env.local` and set Supabase values if you want cloud sync.
3. Run the app.
   `npm run dev`
4. Run tests.
   `npm run test`
5. Build for production.
   `npm run build`

## Supabase setup

1. Create a Supabase project.
2. Enable Anonymous Sign-Ins in Supabase Auth.
3. Run the SQL in `supabase/migrations/202603140001_create_app_snapshots.sql`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` and in your GitHub/Vercel environment configuration.

The app remains fully local-first. Supabase is an optional remote snapshot layer on top of localStorage.

## Vercel deployment from GitHub Actions

The repository includes:

- `.github/workflows/ci.yml`: runs tests and build on PRs and pushes to `main`
- `.github/workflows/deploy-vercel.yml`: deploys to Vercel after the `CI` workflow succeeds on a push to `main`

Configure these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_SUPABASE_ANON_KEY`

Configure this repository variable:

- `VITE_SUPABASE_URL`

For the "after PR is approved and tests pass" behavior, protect `main` in GitHub and require:

- at least one approving review
- the `CI` status check

That keeps deployment gated by your approval policy, while GitHub Actions handles the production Vercel deploy after merge.

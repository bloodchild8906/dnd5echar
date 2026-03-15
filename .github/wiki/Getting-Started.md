# Getting Started

This guide walks through the current Codex Arcanum flow from first launch to an active character dossier.

## Open the App

1. Visit [dnd-campaign-manager.vercel.app](https://dnd-campaign-manager.vercel.app).
2. The app opens into the admin dashboard shell.
3. If Supabase is configured, the app attempts to restore your workspace from Supabase first.
4. If Supabase is not configured or unavailable, the app falls back to browser storage automatically.

## Create Your First Character

1. Click `New Character` from the top bar.
2. The app opens the builder wizard.
3. Move through these steps:
   - `Profile`
   - `Origins`
   - `Abilities`
   - `Combat`
   - `Loadout`
   - `Story`
   - `Review`
4. Finish the wizard to open the live sheet.

## Work With the Character Routes

The active character gets its own route set in the sidebar:

- `Builder` for guided setup
- `Sheet` for the core dossier
- `Spells` for spell operations
- `Inventory` for item management
- `Companions` for allied records
- `Forms` for wild shape and transformation tooling
- `Notes` for freeform recordkeeping

All edits save into the active workspace state and remain recoverable from the local fallback layer.

## Import and Export

Use the `Archive` route to:

- export your current workspace as JSON
- import bundles safely through schema validation and migrations
- create and restore local backup snapshots

## Supabase Persistence

If Supabase is configured:

- the app uses Supabase as the primary persisted store
- localStorage remains the fallback cache
- if Supabase is unavailable, local editing continues normally

See [[Cloud Sync]] for setup details.

## Local Development

If you want to run the app locally:

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

## Next Pages

- [[Character Management]]
- [[Development Setup]]
- [[Roadmap]]

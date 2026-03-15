# Codex Arcanum — Product Overview

Codex Arcanum is a local-first D&D 5e character management workspace. It runs fully offline and optionally syncs to Supabase for multi-device persistence.

## Core Features

- Multi-step character builder wizard
- Character sheet with editable stats, spells, inventory, companions, wild shapes, and notes
- JSON import/export, backup, and restore
- Open5e-backed reference lookups with local caching
- Homebrew entity management
- GM screen and compendium views
- Supabase auth and cloud sync (optional)

## Persistence Model

- Supabase is the primary persistence layer when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured
- localStorage is always the fallback/offline cache
- The app bootstraps from Supabase first, then falls back to local state if unavailable

## Target Users

D&D 5e players and GMs who want a self-contained character management tool that works offline and optionally syncs across devices.

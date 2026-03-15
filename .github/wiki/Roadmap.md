# Roadmap

The tracked product direction for this repository is Codex Arcanum: a D&D 5e character manager that grows into GM sessions, reveals, companions, compendium tooling, and settlement management.

## Canonical Roadmap Source

The full tracked roadmap lives in:

- [`docs/CODEX_ARCANUM_ROADMAP.md`](https://github.com/Bloodchild8906/dnd5echar/blob/main/docs/CODEX_ARCANUM_ROADMAP.md)

## Current Baseline

The original roadmap was written around an older baseline. The repository currently runs on:

- React 19
- React Router 7
- Vite 8
- pnpm 10

Implementation work should adapt the roadmap to this stack rather than trying to downgrade the project.

## Current Implemented Focus

Recent completed work includes:

- admin-dashboard shell and route-aware workspace framing
- step-based character builder wizard
- Supabase-backed persistence with migration-backed local fallback
- pnpm-based toolchain and validation pipeline
- route-level lazy loading to improve bundle shape

## Delivery Approach

The roadmap is being executed in practical vertical slices:

1. stabilize the current stack and Supabase-primary persistence architecture
2. improve the main character workflow
3. expand GM and content-management tooling
4. continue into compendium, settlements, offline, and testing infrastructure

## Related Pages

- [[Architecture Overview]]
- [[Development Setup]]

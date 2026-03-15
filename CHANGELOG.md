# Changelog

## Unreleased - 2026-03-15

### Added

- Admin-dashboard shell and command-center routing for Codex Arcanum
- Step-based character builder wizard with builder math coverage
- Dashboard JSON intake flow with staged validation and per-character export
- Mermaid ERD documentation for the app model and Supabase storage model
- Route-level lazy loading with loading boundaries

### Changed

- Switched the pnpm-based toolchain and validation pipeline to the current stack baseline
- Updated project documentation, wiki pages, and environment examples to match the current app
- Reframed persistence so Supabase is the preferred store when configured and localStorage is the fallback cache
- Updated branding, copy, and settings UX around the new persistence posture

### Fixed

- React external-store snapshot loop caused by unstable Zustand selector output
- Missing favicon asset and related browser 404
- Import/export helper gaps by reusing a single-character bundle builder across dashboard and archive flows
- Styling gaps in the builder wizard introduced by the admin-dashboard shell rewrite

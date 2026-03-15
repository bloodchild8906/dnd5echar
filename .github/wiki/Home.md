# Codex Arcanum Wiki

Welcome to the Codex Arcanum wiki. This documentation tracks the current admin-dashboard application, its Supabase-first persistence model, and the roadmap driving the next feature passes.

## What This App Is

Codex Arcanum is a D&D 5e management workspace for:

- building characters through a guided wizard
- editing live character dossiers across focused routes
- storing homebrew and notes
- importing and exporting JSON bundles
- persisting to Supabase when configured, with localStorage as the fallback cache

## Quick Links

| Resource    | Link                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| Live App    | [dnd-campaign-manager.vercel.app](https://dnd-campaign-manager.vercel.app)                                             |
| Repository  | [github.com/Bloodchild8906/dnd5echar](https://github.com/Bloodchild8906/dnd5echar)                                     |
| README      | [Project README](https://github.com/Bloodchild8906/dnd5echar/blob/main/README.md)                                      |
| Roadmap Doc | [`docs/CODEX_ARCANUM_ROADMAP.md`](https://github.com/Bloodchild8906/dnd5echar/blob/main/docs/CODEX_ARCANUM_ROADMAP.md) |

## Current Highlights

- Admin-console shell with dashboard-style navigation
- Step-based builder wizard
- Character routes for sheet, spells, inventory, companions, forms, and notes
- Supabase-primary persistence with local fallback behavior
- Route-level lazy loading and production size checks

## Wiki Contents

### User Guides

- [[Getting Started]] - First-time setup and basic usage
- [[Character Management]] - Builder flow, live sheet routes, and archive actions
- [[Homebrew Content]] - Managing custom content
- [[Cloud Sync]] - Supabase persistence behavior

### Developer Docs

- [[Architecture Overview]] - App structure, state, persistence, and routing
- [[Development Setup]] - Running the project locally with pnpm
- [[Data Model ERD]] - Mermaid diagrams for the app and Supabase model
- [[Contributing]] - Contribution expectations and workflow
- [[Roadmap]] - Current Codex Arcanum implementation plan

### Reference

- [[Environment Variables]] - Runtime configuration values
- [[Troubleshooting]] - Common issues and recovery steps

## Current Execution Focus

The current implementation focus is:

1. Extending the admin dashboard shell
2. Running the app from Supabase first when configured
3. Continuing roadmap delivery from the documented Codex Arcanum baseline

_Last updated: March 15, 2026_

# Character Management

Character management in Codex Arcanum is split between the dashboard, the builder wizard, and the active dossier routes.

## Dashboard Entry Point

The dashboard acts as the command center for character operations:

- create a new character
- open the active dossier
- jump to archive operations
- monitor local and sync state at a glance

## Builder Wizard

New characters open in a structured builder flow instead of a single long form.

Current builder steps:

1. `Profile`
2. `Origins`
3. `Abilities`
4. `Combat`
5. `Loadout`
6. `Story`
7. `Review`

The builder currently supports:

- Open5e-assisted class, race, and background picks
- standard array assignment
- point buy tracking
- combat baseline setup
- quick starting inventory entry
- features, actions, and notes capture

## Live Character Routes

Once a character exists, the sidebar exposes focused routes for that dossier:

| Route        | Purpose                                          |
| ------------ | ------------------------------------------------ |
| `Builder`    | Structured setup and review                      |
| `Sheet`      | Main character overview and editing              |
| `Spells`     | Prepared spells, slots, and spellcasting details |
| `Inventory`  | Equipment and carried items                      |
| `Companions` | Companion records and related state              |
| `Forms`      | Wild shape and transformation tooling            |
| `Notes`      | Markdown-lite notes and reference text           |

## Saving and Backups

- Character edits save locally.
- Import/export uses validated JSON bundles.
- Local backup snapshots are managed through the archive route.
- Supabase can persist the same state remotely when configured.

## Current Best Practices

- use the builder for first-pass character setup
- use the focused character routes for play-time editing
- export a JSON bundle before large refactors or schema changes
- treat local export and backup snapshots as the safety net for the Supabase-backed workspace

## Related Pages

- [[Getting Started]]
- [[Cloud Sync]]
- [[Roadmap]]

# Requirements Document

## Introduction

Codex Arcanum is a local-first D&D 5e character sheet manager built with React 19, TypeScript strict mode, Vite, Zustand, Zod, React Router 7, and optional Supabase cloud sync. The application provides a full character lifecycle — from a guided creation wizard through an editable sheet — and expands into GM session hosting, nested inventory, companion management, wild shape and polymorph overlays, a floating compendium panel, a settlement manager, and a homebrew authoring suite. All persisted data is Zod-validated and migration-backed. Supabase features degrade gracefully when environment variables are absent.

## Glossary

- **App**: The Codex Arcanum single-page application.
- **Character**: A D&D 5e player character record conforming to the `Character` Zod schema.
- **CharacterBuilder**: The multi-step wizard that guides a user through character creation.
- **CharacterSheet**: The full inline-editable view of a single Character.
- **StorageService**: The localStorage persistence layer that loads on mount and auto-saves on change.
- **MigrationRunner**: The synchronous schema migration runner that executes before first render.
- **Open5eClient**: The HTTP client that fetches D&D reference data from `api.open5e.com`.
- **ReferenceCache**: The localStorage-backed cache of Open5e API responses.
- **Compendium**: The browsable, searchable panel of D&D reference and homebrew content.
- **Companion**: A familiar, pet, summoned creature, mount, or NPC follower owned by a Character.
- **WildShapeForm**: A beast form record used by Druid wild shape and polymorph transformations.
- **HomebrewEntry**: A user-authored or cloned-and-modified content record.
- **Note**: A freeform text record linked optionally to a Character or entity.
- **Game**: A Supabase-backed session container owned by a GM user.
- **Session**: A single play session record within a Game.
- **GM**: Game Master — the authenticated user who owns a Game.
- **Player**: An authenticated user who has accepted an invite to a Game.
- **Co-GM**: A Player granted elevated permissions within a Game.
- **SupabaseSyncService**: The service that pushes and pulls character snapshots to/from Supabase.
- **Settlement**: A named in-world location with 13 management sections.
- **InventoryContainer**: A named bag, pouch, or pack that holds InventoryItems.
- **InventoryItem**: A single item record within a Character or Companion inventory.
- **AppStore**: The Zustand store composed of slice modules.
- **Snapshot**: A versioned backup bundle of the full PersistedAppData.
- **IndexedDB**: The browser storage API used in Phase 7 to replace localStorage.
- **PWA**: Progressive Web App — offline-capable installable web application.
- **Storybook**: Component development and documentation environment.
- **Playwright**: End-to-end browser test framework.

## Requirements

---

### Requirement 1: Project Scaffold and Toolchain

**User Story:** As a developer, I want a fully configured project scaffold, so that I can build and ship features with consistent quality gates.

#### Acceptance Criteria

1. THE App SHALL be scaffolded with Vite, React 19, and TypeScript strict mode enabled.
2. THE App SHALL include Zustand, Zod, React Router 7, ESLint, and Prettier as configured dependencies.
3. WHEN a pull request is opened, THE App SHALL run lint, type-check, test, and build steps via GitHub Actions CI before merge is permitted.
4. WHEN a commit is merged to main, THE App SHALL be automatically deployed to Vercel production.
5. THE App SHALL enforce branch protection on main requiring CI pass and at least one approving review.
6. THE App SHALL provide a `.env.example` file documenting `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as optional variables.
7. THE AppStore SHALL be composed using the Zustand slice pattern with at minimum `characterSlice`, `appSlice`, and `compendiumSlice` modules.
8. THE App SHALL define base Zod schemas for `Character`, `CharacterMeta`, and `AppSettings`.

---

### Requirement 2: Persistence and Schema Migrations

**User Story:** As a user, I want my character data saved automatically and safely upgraded across app versions, so that I never lose progress.

#### Acceptance Criteria

1. THE StorageService SHALL load persisted data from localStorage on application mount.
2. WHEN the AppStore state changes, THE StorageService SHALL persist the updated state to localStorage with a debounce of no more than 1000 ms.
3. THE MigrationRunner SHALL execute synchronously before the first React render.
4. WHEN persisted data has a version field lower than the current schema version, THE MigrationRunner SHALL apply all intermediate migration functions in ascending version order.
5. WHEN persisted data has no version field, THE MigrationRunner SHALL treat it as version 1 and apply all migrations from version 1 onward.
6. WHEN a migration produces data that fails Zod schema validation, THE MigrationRunner SHALL fall back to seed data rather than rendering corrupt state.
7. THE App SHALL store a `version` integer field on every persisted record.
8. FOR ALL valid PersistedAppData objects, serializing then deserializing then migrating SHALL produce an equivalent object (round-trip property).

---

### Requirement 3: Character Builder Wizard

**User Story:** As a player, I want a guided multi-step wizard to create a new character, so that I can make all required choices in a structured flow.

#### Acceptance Criteria

1. THE CharacterBuilder SHALL present a step indicator showing all steps and the current active step.
2. THE CharacterBuilder SHALL provide back and next navigation controls on every step.
3. WHEN the user is on the first step, THE CharacterBuilder SHALL disable the back navigation control.
4. WHEN the user is on the last step, THE CharacterBuilder SHALL replace the next control with a confirm control.
5. WHEN Step 1 is active, THE CharacterBuilder SHALL fetch race options from the Open5eClient, display each race's name and traits, and store the user's selection.
6. WHEN Step 2 is active, THE CharacterBuilder SHALL fetch class options from the Open5eClient, display each class's hit die and proficiencies, and store the user's selection.
7. WHEN Step 3 is active, THE CharacterBuilder SHALL fetch background options from the Open5eClient, display each background's skill grants and feature, and store the user's selection.
8. WHEN Step 4 is active and the user selects standard array mode, THE CharacterBuilder SHALL present the six standard array values (15, 14, 13, 12, 10, 8) for drag-to-slot assignment across the six ability scores.
9. WHEN Step 4 is active and the user selects point buy mode, THE CharacterBuilder SHALL enforce a 27-point budget, allow scores from 8 to 15, and apply the correct cost schedule (scores 9–13 cost 1 point each, 14 costs 2 points, 15 costs 3 points).
10. WHEN racial ability score improvement bonuses are defined for the selected race, THE CharacterBuilder SHALL apply those bonuses on top of the chosen base scores and display the final totals.
11. WHEN Step 5 is active, THE CharacterBuilder SHALL list the class starting equipment options as radio choices and provide a freeform item addition field.
12. WHEN Step 6 is active, THE CharacterBuilder SHALL present freeform fields for name, alignment, appearance, and backstory.
13. WHEN Step 7 is active, THE CharacterBuilder SHALL display a review screen summarising all choices and allow back-navigation to any prior step.
14. WHEN the user confirms on the review screen, THE CharacterBuilder SHALL write the full Character record to the AppStore, persist it via the StorageService, and navigate to the CharacterSheet route.
15. IF the Open5eClient returns an error during any wizard step, THEN THE CharacterBuilder SHALL display an error message and provide a retry control without losing previously entered data.

---

### Requirement 4: Editable Character Sheet — Header and Core Stats

**User Story:** As a player, I want to view and edit my character's core identity and ability scores inline, so that I can keep my sheet current during play.

#### Acceptance Criteria

1. THE CharacterSheet SHALL display the character's name, race, class, subclass, background, alignment, level, and experience points in a header section.
2. WHEN the user edits any header field, THE CharacterSheet SHALL update the AppStore and trigger a debounced auto-save within 1000 ms.
3. THE CharacterSheet SHALL display all six ability scores with their total value, modifier, and saving throw bonus.
4. WHEN a manual override is set on an ability score or saving throw, THE CharacterSheet SHALL display the overridden value with a visual indicator distinguishing it from the auto-calculated value.
5. THE CharacterSheet SHALL display the proficiency bonus, calculated as `ceil(1 + level / 4)` with a minimum of 2, unless a manual override is active.
6. THE CharacterSheet SHALL display all 18 skill bonuses with proficiency indicators for none, proficient, and expertise states.
7. THE CharacterSheet SHALL display passive Perception, passive Investigation, and passive Insight scores as `10 + skill bonus`.

---

### Requirement 5: Editable Character Sheet — Combat

**User Story:** As a player, I want to track combat stats and hit points inline, so that I can manage my character's state during encounters.

#### Acceptance Criteria

1. THE CharacterSheet SHALL display Armor Class, Initiative, Speed, current HP, maximum HP, temporary HP, hit dice, and death save trackers.
2. WHEN the user adjusts current HP, THE CharacterSheet SHALL clamp the value between 0 and maximum HP plus temporary HP.
3. WHEN the user marks a death save success or failure, THE CharacterSheet SHALL update the death save state and persist the change.
4. WHEN the character has 3 death save failures, THE CharacterSheet SHALL display a visual indicator that the character is dead.
5. WHEN the character has 3 death save successes, THE CharacterSheet SHALL display a visual indicator that the character is stable.
6. THE CharacterSheet SHALL display resistance, immunity, and vulnerability lists as editable tag inputs.
7. THE CharacterSheet SHALL display an inspiration toggle that persists its state.

---

### Requirement 6: Editable Character Sheet — Spellbook

**User Story:** As a spellcasting player, I want to manage my spells, slots, and spell save DC inline, so that I can track my spellcasting resources during play.

#### Acceptance Criteria

1. THE CharacterSheet SHALL display spell slots for levels 1 through 9 with used and maximum counts.
2. WHEN the user expends or recovers a spell slot, THE CharacterSheet SHALL update the used count and persist the change.
3. THE CharacterSheet SHALL display the spell save DC and spell attack bonus, calculated from the spellcasting ability, proficiency bonus, and any active overrides.
4. THE CharacterSheet SHALL display prepared spells, known spells, innate spells, and item-granted spells in separate filterable lists.
5. WHEN the user toggles a spell's prepared state, THE CharacterSheet SHALL update the preparation state and persist the change.
6. THE CharacterSheet SHALL display pact magic slots separately when pact magic is enabled, with their own used and maximum counts.
7. WHEN the user adds a spell from the Compendium to the spellbook, THE CharacterSheet SHALL create a SpellPreparationState entry and persist it.

---

### Requirement 7: Editable Character Sheet — Inventory

**User Story:** As a player, I want to manage my inventory with containers and items inline, so that I can track my equipment and currency during play.

#### Acceptance Criteria

1. THE CharacterSheet SHALL display inventory items grouped by their assigned InventoryContainer.
2. THE CharacterSheet SHALL display items with no container assignment in an unassigned group.
3. WHEN the user adds an item, THE CharacterSheet SHALL create an InventoryItem record and persist it.
4. WHEN the user edits an item's quantity, weight, value, or notes, THE CharacterSheet SHALL update the record and persist the change.
5. WHEN the user moves an item to a different container, THE CharacterSheet SHALL update the item's `containerId` and persist the change.
6. THE CharacterSheet SHALL display the total carried weight and the carry capacity calculated as `Strength score × 15`.
7. WHEN encumbrance mode is set to standard and total carried weight exceeds carry capacity, THE CharacterSheet SHALL display an encumbered indicator.
8. THE CharacterSheet SHALL display the currency wallet with fields for cp, sp, ep, gp, and pp.
9. WHEN the user edits a currency denomination, THE CharacterSheet SHALL update the wallet and persist the change.
10. THE CharacterSheet SHALL display the count of attuned items and indicate when the attunement limit of 3 is reached.

---

### Requirement 8: Editable Character Sheet — Features, Actions, and Notes

**User Story:** As a player, I want to record my character's features, actions, and freeform notes, so that I have all relevant information in one place.

#### Acceptance Criteria

1. THE CharacterSheet SHALL display a features list where each entry has a name and description, both inline editable.
2. THE CharacterSheet SHALL display an actions list where each entry has a name, description, optional attack bonus, optional damage roll, and optional notes.
3. WHEN the user adds or removes a feature or action, THE CharacterSheet SHALL update the list and persist the change.
4. THE CharacterSheet SHALL display a freeform notes field supporting plain text and markdown-lite formatting.
5. WHEN the user edits the notes field, THE CharacterSheet SHALL update the notes and trigger a debounced auto-save within 1000 ms.

---

### Requirement 9: Multi-Character Management

**User Story:** As a player, I want a home screen listing all my characters, so that I can switch between, duplicate, or delete them easily.

#### Acceptance Criteria

1. THE App SHALL display a character list home screen showing a card for each Character with name, race, class, level, and current/maximum HP.
2. WHEN the user selects a character card, THE App SHALL navigate to that character's CharacterSheet.
3. THE App SHALL provide a New Character button on the home screen that navigates to the CharacterBuilder.
4. WHEN the user chooses to duplicate a character, THE App SHALL create a deep copy with a new ID and the suffix " Copy" appended to the name.
5. WHEN the user chooses to delete a character, THE App SHALL display a confirmation prompt before removing the Character and all associated Companions from the AppStore.
6. THE App SHALL provide an export action on each character card that triggers a single-character JSON export.

---

### Requirement 10: Export and Import

**User Story:** As a user, I want to export and import my full data bundle as JSON, so that I can back up, restore, or transfer my characters.

#### Acceptance Criteria

1. THE App SHALL provide an export action that serialises the full PersistedAppData bundle to a JSON file and triggers a browser download.
2. THE App SHALL provide an import action that accepts a JSON file and validates it against the `importExportBundleSchema` Zod schema before applying it.
3. IF the imported JSON fails Zod validation, THEN THE App SHALL display a descriptive error message and leave the existing AppStore state unchanged.
4. THE App SHALL support drag-to-import by accepting a JSON file dropped onto the import zone.
5. FOR ALL valid PersistedAppData bundles, exporting then importing SHALL produce an AppStore state equivalent to the original (round-trip property).

---

### Requirement 11: Open5e Integration and Compendium Browser

**User Story:** As a player or GM, I want to browse D&D reference content from Open5e, so that I can look up rules and add content to my character.

#### Acceptance Criteria

1. THE Open5eClient SHALL support fetching paginated lists for classes, races, backgrounds, feats, spells, monsters, weapons, armor, and magic items.
2. THE Open5eClient SHALL support fetching a single resource by slug.
3. THE Open5eClient SHALL support full-text search across any resource type.
4. WHEN an Open5e response is received, THE ReferenceCache SHALL store the result in localStorage keyed by resource type and query parameters.
5. WHEN a cached entry exists and its `fetchedAt` timestamp is within the configured `referenceCacheHours` window, THE Open5eClient SHALL return the cached result without making a network request.
6. WHEN the network is unavailable and a cached entry exists, THE Open5eClient SHALL return the cached result.
7. IF the network is unavailable and no cached entry exists, THEN THE Open5eClient SHALL return an empty result set and surface an offline indicator in the UI.
8. THE Compendium SHALL display a browsable, filterable list of reference entries for each resource type.
9. WHEN the user selects a compendium entry, THE Compendium SHALL display a detail panel with the full entry data.

---

### Requirement 12: Unit Tests — Core Logic

**User Story:** As a developer, I want unit tests covering migrations, schemas, ability score calculations, and derived stats, so that regressions are caught automatically.

#### Acceptance Criteria

1. THE App SHALL include unit tests that verify each MigrationRunner migration function produces valid output conforming to the target schema version.
2. THE App SHALL include unit tests that verify the `characterSchema` Zod schema accepts valid Character objects and rejects invalid ones.
3. THE App SHALL include unit tests that verify ability score modifier calculation as `floor((score - 10) / 2)` for all integer scores from 1 to 30.
4. THE App SHALL include unit tests that verify proficiency bonus calculation for all character levels 1 through 20.
5. THE App SHALL include unit tests that verify point buy cost schedule: scores 8–13 cost `score - 8` points, score 14 costs 7 points, score 15 costs 9 points.
6. THE App SHALL include unit tests that verify the standard array assignment swap logic preserves all six values with no duplicates.
7. THE App SHALL include unit tests that verify spell save DC and spell attack bonus derivation from ability modifier and proficiency bonus.
8. FOR ALL valid Character objects, computing derived stats SHALL produce the same result when called multiple times with the same input (idempotence property).

---

### Requirement 13: GM Mode — Authentication and Game Management

**User Story:** As a GM, I want to create and manage games with Supabase-backed auth, so that I can host sessions for my players.

#### Acceptance Criteria

1. WHEN Supabase environment variables are present, THE App SHALL provide email/password authentication via Supabase Auth.
2. WHEN the user is authenticated, THE App SHALL display the user's email and a sign-out control.
3. WHEN the user is not authenticated and attempts to access a GM-only route, THE App SHALL redirect to the auth page.
4. WHEN an authenticated user creates a Game, THE App SHALL insert a game record in Supabase with the creator as GM and persist the game ID locally.
5. THE App SHALL display a list of Games the authenticated user belongs to, showing game name, GM name, and the user's role.
6. WHEN Supabase environment variables are absent, THE App SHALL hide all GM Mode features and display a configuration notice rather than an error.

---

### Requirement 14: GM Mode — Invites and Role-Based Permissions

**User Story:** As a GM, I want to invite players by username or shareable link, so that they can join my game with the correct permissions.

#### Acceptance Criteria

1. THE App SHALL allow a GM to invite a player by entering the player's username, generating an invite record in Supabase.
2. THE App SHALL allow a GM to generate a shareable invite link that encodes the game ID and a one-time token.
3. WHEN a user follows a valid invite link, THE App SHALL present a join confirmation screen and add the user to the game as a Player on confirmation.
4. WHEN a GM promotes a Player to Co-GM, THE App SHALL update the user's role in Supabase and grant Co-GM permissions immediately.
5. THE App SHALL enforce that only the GM and Co-GMs can edit game settings, manage invites, and view GM-only data.
6. THE App SHALL enforce that Players can only read and edit their own characters within a game.
7. IF an invite token has already been used or has expired, THEN THE App SHALL display an error message and prevent the join action.

---

### Requirement 15: GM Mode — Realtime Sync and Session Log

**User Story:** As a GM or player, I want character changes to sync in realtime during a session, so that everyone sees the current state of the game.

#### Acceptance Criteria

1. WHEN a Player updates their character during an active session, THE SupabaseSyncService SHALL push the updated character snapshot to Supabase within 5 seconds.
2. WHEN a character snapshot is updated in Supabase, THE App SHALL receive the change via Supabase Realtime and update the local AppStore for all connected session participants.
3. THE App SHALL display a session log panel showing timestamped entries for character updates, HP changes, and GM notes.
4. WHEN a GM adds a session log entry, THE App SHALL persist the entry to Supabase and broadcast it to all session participants.
5. THE SupabaseSyncService SHALL never include GM-only data fields in player-facing realtime payloads.
6. WHEN the Supabase connection is interrupted, THE App SHALL display a reconnecting indicator and resume sync automatically when the connection is restored.

---

### Requirement 16: Nested Inventory and Containers

**User Story:** As a player, I want to organise items into nested containers with capacity tracking, so that I can model realistic encumbrance.

#### Acceptance Criteria

1. THE App SHALL support InventoryContainers with an optional `parentId` field enabling nested container hierarchies.
2. THE App SHALL render nested containers as an indented tree in the inventory UI.
3. WHEN the user drags an item from one container to another, THE App SHALL update the item's `containerId` and persist the change.
4. WHEN a container has a defined weight capacity and the total weight of its contents exceeds that capacity, THE App SHALL display a capacity bar in an over-capacity state.
5. THE App SHALL support marking an InventoryItem as cursed, unidentified, or locked, with those states visible only to the GM until revealed.
6. WHEN a GM reveals a cursed or unidentified item to a player, THE App SHALL update the item's visibility state and notify the player via the session log.

---

### Requirement 17: Companions and Familiars

**User Story:** As a player, I want to manage familiars, pets, and followers with full stat blocks, so that I can track all my companions in one place.

#### Acceptance Criteria

1. THE App SHALL display a companions panel for each Character listing all associated Companion records.
2. THE App SHALL support companion types: pet, familiar, summoned, mount, and npc-follower.
3. WHEN the user creates a Companion, THE App SHALL initialise a full ActorStatBlock and persist the record linked to the parent Character ID.
4. THE App SHALL allow inline editing of all Companion stat block fields including abilities, AC, HP, speed, actions, and traits.
5. WHEN the user deletes a Character, THE App SHALL also delete all Companions whose `parentCharacterId` matches the deleted Character.
6. THE App SHALL support a Companion spellbook with the same slot and preparation model as the Character spellbook.
7. THE App SHALL support a Companion inventory with the same container and item model as the Character inventory.

---

### Requirement 18: Wild Shape and Polymorph

**User Story:** As a Druid or polymorphed character, I want to enter and exit beast forms with separate HP tracking, so that I can manage transformations accurately.

#### Acceptance Criteria

1. THE App SHALL display a wild shapes panel listing all WildShapeForm records for a Character.
2. WHEN the user activates a WildShapeForm, THE App SHALL create an ActiveFormState with the form's maximum HP, store the character's current HP as `revertHp`, and display a Beast Form Overlay.
3. WHILE a WildShapeForm is active, THE App SHALL track damage against the form's HP separately from the character's HP.
4. WHEN the form's HP reaches 0, THE App SHALL automatically revert the character to their original form and restore the `revertHp` value.
5. THE App SHALL allow the user to manually revert from a form at any time, restoring the `revertHp` value.
6. THE App SHALL support a Polymorph Overlay with the same HP tracking model as Wild Shape but applicable to any creature stat block.
7. WHEN a WildShapeForm is active, THE App SHALL display the form's stat block alongside the character's retained mental ability scores.

---

### Requirement 19: Compendium Panel — Floating and Drag-to-Sheet

**User Story:** As a player or GM, I want a floating, resizable compendium panel I can keep open while editing my sheet, so that I can reference and apply content without navigating away.

#### Acceptance Criteria

1. THE Compendium SHALL be openable as a floating, draggable, and resizable panel that overlays the current route.
2. WHEN the user drags a compendium entry onto the CharacterSheet, THE App SHALL apply the entry to the appropriate sheet section (spell to spellbook, item to inventory, etc.).
3. THE Compendium SHALL maintain a history of recently viewed entries across sessions.
4. THE Compendium SHALL allow the user to pin entries to a persistent shelf visible at the top of the panel.
5. THE Compendium SHALL support a global search that queries all resource types simultaneously and ranks results by relevance.
6. WHEN the user pins an entry, THE App SHALL persist the pinned entry to `uiPreferences.compendium.pinnedEntries` and restore it on next load.

---

### Requirement 20: Homebrew Authoring

**User Story:** As a GM or player, I want to create and edit homebrew content for all major D&D content types, so that I can extend the game with custom material.

#### Acceptance Criteria

1. THE App SHALL provide homebrew creation forms for: spells, weapons, magic items, classes, races, backgrounds, feats, conditions, languages, proficiencies, monsters, and encounter templates.
2. WHEN the user creates a HomebrewEntry, THE App SHALL validate the entry against the `homebrewEntrySchema` Zod schema before persisting it.
3. THE App SHALL allow the user to clone an Open5e reference entry into a HomebrewEntry, preserving the original data in `sourceData` and storing overrides in `overrideData`.
4. WHEN a HomebrewEntry is cloned from an Open5e entry, THE App SHALL set `sourceRef.sourceType` to `cloned-from-open5e`.
5. THE App SHALL display homebrew entries in the Compendium alongside Open5e entries, visually distinguished by a homebrew badge.
6. WHEN the user exports a homebrew pack, THE App SHALL serialise all HomebrewEntry records to a JSON file and trigger a browser download.
7. WHEN the user imports a homebrew pack, THE App SHALL validate each entry against `homebrewEntrySchema` and reject any entry that fails validation with a descriptive error.

---

### Requirement 21: Settlement Manager

**User Story:** As a GM, I want a dedicated settlement manager with structured sections, so that I can build and reference in-world locations during play.

#### Acceptance Criteria

1. THE App SHALL provide a Settlement Manager route supporting multiple named settlements.
2. WHEN the user creates a Settlement, THE App SHALL initialise records for all 13 sections: Overview, Demographics, Economy, Government, Religion, Locations/POIs, Interactive Map, Notable NPCs, Factions/Guilds, Job Board, Events, Timeline, and Lore & History.
3. THE App SHALL allow inline editing of all settlement section fields with debounced auto-save.
4. THE App SHALL support map pin placement on the Interactive Map section, with each pin linked to a Location/POI entry.
5. THE App SHALL allow a GM to publish a Settlement to the Compendium, making it visible to Players in the associated Game.
6. WHEN the user exports a Settlement, THE App SHALL serialise the full settlement record to a JSON file and trigger a browser download.
7. WHEN the user imports a Settlement JSON file, THE App SHALL validate it against the settlement schema and reject invalid files with a descriptive error.

---

### Requirement 22: IndexedDB Migration and PWA

**User Story:** As a user, I want the app to work offline and store large datasets reliably, so that I can use it without an internet connection.

#### Acceptance Criteria

1. THE App SHALL migrate all persistence from localStorage to IndexedDB in Phase 7.
2. WHEN the IndexedDB migration runs, THE App SHALL read all existing localStorage data, write it to IndexedDB, and verify the written data before clearing localStorage.
3. THE App SHALL register a Service Worker that caches all static assets and API responses required for offline operation.
4. WHEN the app is launched without a network connection and the Service Worker cache is populated, THE App SHALL render fully without network requests.
5. THE App SHALL be installable as a PWA on desktop and mobile browsers that support the Web App Manifest.
6. WHEN a new version of the Service Worker is available, THE App SHALL display an update notification and reload the app on user confirmation.

---

### Requirement 23: Performance and Accessibility

**User Story:** As a user, I want the app to load quickly and be usable with assistive technologies, so that it is accessible and responsive.

#### Acceptance Criteria

1. THE App SHALL keep the initial JavaScript bundle below 250 kB gzipped as enforced by the size-limit CI check.
2. THE App SHALL keep the initial CSS bundle below 20 kB gzipped as enforced by the size-limit CI check.
3. WHEN a list contains more than 50 items, THE App SHALL render it using a virtualised list component to avoid DOM bloat.
4. THE App SHALL use semantic HTML elements and ARIA attributes so that all interactive controls are operable via keyboard navigation.
5. THE App SHALL provide explicit loading states for all asynchronous operations including Open5e fetches and Supabase calls.
6. THE App SHALL provide explicit error states for all asynchronous operations with actionable recovery options.
7. THE App SHALL support an undo stack for editing-heavy workflows including character sheet edits and inventory changes.

---

### Requirement 24: Print and PDF Export

**User Story:** As a player, I want to print or export my character sheet as a PDF, so that I can bring a physical copy to the table.

#### Acceptance Criteria

1. THE App SHALL provide a print action on the CharacterSheet that applies the `print.css` stylesheet and triggers the browser print dialog.
2. WHEN print options are configured to show notes, THE App SHALL include the notes section in the print layout.
3. WHEN print options are configured to show spellbook, THE App SHALL include the spellbook section in the print layout.
4. THE App SHALL hide navigation, action buttons, and non-content UI elements in the print layout.

---

### Requirement 25: Versioned Snapshots

**User Story:** As a user, I want to create and restore named snapshots of my full data, so that I can roll back to a previous state if needed.

#### Acceptance Criteria

1. THE App SHALL allow the user to create a named Snapshot of the current PersistedAppData bundle at any time.
2. THE App SHALL display a list of saved Snapshots with their label and creation timestamp.
3. WHEN the user restores a Snapshot, THE App SHALL replace the current AppStore state with the Snapshot bundle after passing it through the MigrationRunner.
4. WHEN the user deletes a Snapshot, THE App SHALL remove it from storage and update the snapshot list.
5. FOR ALL valid Snapshot bundles, creating a snapshot then restoring it SHALL produce an AppStore state equivalent to the state at snapshot creation time (round-trip property).

---

### Requirement 26: Cross-Cutting Data Integrity

**User Story:** As a developer, I want all persisted writes to be Zod-validated and all schema changes to be migration-backed, so that data integrity is maintained across versions.

#### Acceptance Criteria

1. THE App SHALL validate all data against the appropriate Zod schema before writing to any persistence layer.
2. IF a Zod validation fails before a write, THEN THE App SHALL log the validation error and abort the write without corrupting existing data.
3. THE App SHALL require a new migration entry for every change to a persisted schema shape.
4. THE App SHALL include unit tests for every migration function verifying that the output conforms to the target schema.
5. WHILE Supabase features are active, THE App SHALL enforce Row Level Security policies ensuring users can only read and write their own data.
6. THE App SHALL never include GM-only fields in player-facing Supabase Realtime payloads.
7. WHEN Supabase environment variables are absent, THE App SHALL operate in local-only mode with all Supabase-dependent features hidden or disabled.

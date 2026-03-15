# Implementation Plan: Codex Arcanum

## Overview

Seven-phase incremental build on the existing React 19 / TypeScript / Zustand / Zod / Supabase stack.
Each phase is self-contained and leaves the app in a shippable state.
All new state goes in the appropriate named Zustand slice; slices never import from each other.
All persisted writes are Zod-validated; every new persisted shape requires a migration entry.
Property-based tests use **fast-check** (already in devDependencies or add with `pnpm add -D fast-check`).

---

## Phase 1 — Character Sheet Completeness, Builder Polish, Persistence Hardening


- [x] 1. Extend `CharacterSheetPage` with fully inline-editable sections
  - [x] 1.1 Build `AbilityScoreGrid` component — 6 ability tiles each showing score, modifier, and saving throw bonus; wire to `updateCharacter` patch; show `OverrideIndicator` badge when a `ManualOverride` is active
    - _Requirements: 4.3, 4.4, 4.5_
  - [x] 1.2 Build `SkillList` component — 18 skills with three-state proficiency toggle (none / proficient / expertise); display computed bonus; wire to `updateCharacter`
    - _Requirements: 4.6_
  - [x] 1.3 Build `CombatBlock` component — AC, initiative, speed, HP adjuster (clamp 0 ≤ current ≤ max + temp), death saves with dead/stable indicators, inspiration toggle; wire to `updateCharacter`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_
  - [x] 1.4 Write property test for HP clamping invariant
    - **Property 11: HP clamping invariant** — for any character and any HP delta, `combat.hitPoints.current` satisfies `0 ≤ current ≤ max + temp`
    - **Validates: Requirements 5.2**
    - File: `src/store/slices/charactersSlice.test.ts`
  - [x] 1.5 Build `SpellbookSection` component — slot grid (levels 1–9), pact magic row, prepared/known/innate/item-granted spell lists with toggle; wire to `updateSpellSlot`, `updatePactMagic`, `updateCharacterSpell`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 1.6 Build `InventorySection` component — container tree, item rows (quantity/weight/value/notes inline editable), currency wallet, weight bar with encumbered indicator; wire to `inventorySlice` actions
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_
  - [x] 1.7 Write property test for carry capacity formula
    - **Property 12: Carry capacity formula** — `getCarryCapacity(character) === getAbilityTotal(character, 'strength') * 15`
    - **Validates: Requirements 7.6**
    - File: `src/domain/derived.test.ts`
  - [x] 1.8 Build `FeaturesSection` component — features and actions list with inline add/edit/delete; wire to `updateCharacter`
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 1.9 Build `ConditionsBar` component — tag-input for conditions; wire to `updateCharacter`
    - _Requirements: 8.4, 8.5_
  - [x] 1.10 Wire all new section components into `CharacterSheetPage` replacing the existing stub sections; ensure each section is reachable via `CharacterTabs`
    - _Requirements: 4.1, 4.2_

- [ ] 2. Polish `CharacterBuilderPage` — builder parity and review step
  - [x] 2.1 Add equipment step (Step 5): list class starting equipment options as radio choices plus freeform item addition field; write selected items to `character.inventory.items` via `addCharacterItem`
    - _Requirements: 3.11_
  - [x] 2.2 Add story step (Step 6): freeform fields for appearance and backstory stored in `character.notes` and `character.featureNotes`
    - _Requirements: 3.12_
  - [x] 2.3 Complete review step (Step 7): display summary of all choices; allow back-navigation to any prior step by index; confirm navigates to `/characters/:id/sheet`
    - _Requirements: 3.13, 3.14_
  - [x] 2.4 Apply racial ASI bonuses from selected race's `raw` data onto ability score `bonus` fields when race selection changes
    - _Requirements: 3.10_
  - [x] 2.5 Write property test for standard array multiset preservation
    - **Property 8: Standard array assignment preserves multiset** — for any `assignStandardArrayScore` call the six resulting scores equal the multiset {15,14,13,12,10,8}
    - **Validates: Requirements 12.6**
    - File: `src/features/characters/builderMath.test.ts`
  - [x] 2.6 Write property test for point buy cost schedule and budget invariant
    - **Property 7: Point buy cost schedule and budget invariant** — for any six scores in [8,15], `getPointBuyTotal` equals sum of individual costs per schedule; valid assignment has total ≤ 27
    - **Validates: Requirements 3.8, 12.5**
    - File: `src/features/characters/builderMath.test.ts`

- [ ] 3. Harden persistence layer and expand unit coverage
  - [x] 3.1 Add migration `v3 → v4` in `migrations.ts` that back-fills any new optional fields added in Phase 1 (e.g. `conditions` array, `featureNotes`); bump `STORAGE_VERSION` to 4
    - _Requirements: 2.4, 2.5, 26.3_
  - [x] 3.2 Write property test for migration valid output
    - **Property 1: Migration produces valid output** — for any raw object at version ≤ current, `migratePersistedAppData` output passes `persistedAppDataSchema.safeParse` without errors
    - **Validates: Requirements 2.4, 2.5, 2.6**
    - File: `src/services/storage/migrations.test.ts`
  - [x] 3.3 Write property test for serialization round-trip
    - **Property 2: Serialization round-trip** — `parseImportBundle(serializeBundle(data))` deeply equals original
    - **Validates: Requirements 2.8, 10.5**
    - File: `src/services/storage/storageService.test.ts`
  - [x] 3.4 Write property test for export/import round-trip
    - **Property 3: Export/import round-trip** — `characters`, `companions`, `notes`, `homebrew` arrays survive export → import unchanged
    - **Validates: Requirements 10.5**
    - File: `src/services/storage/storageService.test.ts`
  - [x] 3.5 Write property test for snapshot round-trip
    - **Property 4: Snapshot round-trip** — `restoreBackup(createBackupSnapshot(data).id)` deeply equals original state
    - **Validates: Requirements 25.5**
    - File: `src/services/storage/storageService.test.ts`
  - [x] 3.6 Expand `derived.test.ts` unit coverage to 100% line coverage — add tests for `getArmorClass`, `getInitiative`, `getPassiveScore`, `getEncumbranceStatus`, `compareFormToCharacter`, `getMergedHomebrewData`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.7, 12.8_
  - [x] 3.7 Write property test for ability score modifier formula
    - **Property 5: Ability score modifier formula** — for any integer score in [1,30], `getAbilityModifier` returns `Math.floor((score - 10) / 2)`
    - **Validates: Requirements 12.3**
    - File: `src/domain/derived.test.ts`
  - [x] 3.8 Write property test for proficiency bonus formula
    - **Property 6: Proficiency bonus formula** — for any level in [1,20], `getProficiencyBonus` returns `Math.max(2, Math.ceil(1 + level / 4))`
    - **Validates: Requirements 4.5, 12.4**
    - File: `src/domain/derived.test.ts`
  - [x] 3.9 Write property test for spell save DC and attack bonus derivation
    - **Property 9: Spell save DC and attack bonus derivation** — `getSpellSaveDc` = `8 + profBonus + abilMod` unless override active; `getSpellAttackBonus` = `profBonus + abilMod` unless override active
    - **Validates: Requirements 12.7**
    - File: `src/domain/derived.test.ts`
  - [x] 3.10 Write property test for derived stats idempotence
    - **Property 10: Derived stats idempotence** — calling any derived stat function twice with the same `Character` input returns the same value
    - **Validates: Requirements 12.8**
    - File: `src/domain/derived.test.ts`

- [ ] 4. Tighten Open5e caching, offline handling, and error states
  - [x] 4.1 Update `open5eClient` to check `referenceCache` before fetching; return cached result when `fetchedAt` is within `referenceCacheHours`; set `error = 'offline'` and return empty result when offline and no cache
    - _Requirements: 11.4, 11.5, 11.6, 11.7_
  - [x] 4.2 Update `useOpen5eResource` hook to expose `{ items, loading, error }` and surface offline indicator in all consumers (`CharacterBuilderPage`, `CompendiumPage`)
    - _Requirements: 11.7, 23.5, 23.6_
  - [x] 4.3 Add retry control to `CharacterBuilderPage` Open5e error states without losing previously entered data
    - _Requirements: 3.15_

- [x] 5. Checkpoint — Phase 1 complete
  - Ensure all tests pass, ask the user if questions arise.


---

## Phase 2 — Supabase Auth, Games, Memberships, Invites, Realtime Sync, Session Logs

- [ ] 6. Supabase schema migrations for Phase 2
  - [x] 6.1 Write SQL migration `202603140003_session_log_invite_tokens.sql` — create `session_log_entries` and `invite_tokens` tables with RLS policies; GM and Co-GM can insert session log entries; only the game owner can insert invite tokens
    - _Requirements: 13.4, 14.1, 14.2, 15.3, 15.4, 26.5_
  - [x] 6.2 Add `SessionLogEntry` and `InviteToken` TypeScript interfaces to `src/domain/collaboration.ts`; add corresponding Zod schemas to `src/domain/schemas.ts`
    - _Requirements: 26.1_

- [ ] 7. Implement `GamesPage` and `GameDetailPage`
  - [x] 7.1 Build `GamesPage` — list games via `collaborationService.listGamesForUser`; create game form; join-by-code form; navigate to `/games/:gameId` on selection; hide entire page when `!isSupabaseConfigured()`
    - _Requirements: 13.5, 13.6_
  - [x] 7.2 Build `GameDetailPage` — members list with role badges; invite controls (username invite + shareable link generation); character bundles list; `PermissionEditor` component for role/permission toggles
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_
  - [x] 7.3 Add `generateInviteToken` and `consumeInviteToken` methods to `collaborationService`; validate token expiry and used-at before joining; surface error when token is invalid or expired
    - _Requirements: 14.7_
  - [x] 7.4 Add `/games/:gameId` route to `router.tsx` with lazy-loaded `GameDetailPage`
    - _Requirements: 13.5_

- [ ] 8. Extend `gamesSlice` in Zustand store
  - [x] 8.1 Create `src/store/slices/gamesSlice.ts` with actions: `setGames`, `addGame`, `removeGame`, `setActiveMemberships`; add `GamesSlice` to `AppStore` type in `types.ts`; wire into `useAppStore.ts`
    - _Requirements: 13.4, 13.5_
  - [x] 8.2 Add `updateMembership` action that calls `collaborationService.updateMembership` and updates local slice state; enforce that only GM/Co-GM callers can invoke it (check role before dispatch)
    - _Requirements: 14.4, 14.5_

- [ ] 9. Realtime sync and session log
  - [x] 9.1 Extend `collaborationService` with `subscribeToCharacterBundles(gameId, callback)` and `unsubscribe()` using Supabase Realtime; merge incoming bundle into AppStore via `replaceAllData` merge path; never include GM-only fields in player payloads
    - _Requirements: 15.1, 15.2, 15.5_
  - [x] 9.2 Build `RealtimeSyncIndicator` component — connection status badge (connected / reconnecting / offline) in `AppShell` header; auto-resubscribe on reconnect
    - _Requirements: 15.6_
  - [x] 9.3 Build `SessionLogPanel` component — timestamped entries list; GM note input; calls `collaborationService.addSessionLogEntry`; subscribes to realtime log updates
    - _Requirements: 15.3, 15.4_
  - [x] 9.4 Trigger session log entries automatically when HP changes or character is updated during an active session (hook into `useSupabaseAutoSync` subscriber)
    - _Requirements: 15.1, 15.3_

- [ ] 10. Auth hardening
  - [x] 10.1 Add route guard in `router.tsx` — redirect unauthenticated users away from `/games/*` and `/gm` to `/auth`; show configuration notice (not error) when Supabase env vars absent
    - _Requirements: 13.3, 13.6_
  - [x] 10.2 Display authenticated user email and sign-out control in `AppShell` header when session is active
    - _Requirements: 13.2_

- [x] 11. Checkpoint — Phase 2 complete
  - Ensure all tests pass, ask the user if questions arise.


---

## Phase 3 — Nested Inventory, Drag-and-Drop, GM Visibility Controls

- [ ] 12. Extend inventory data models and schemas
  - [x] 12.1 Add optional fields `cursed`, `identified`, `locked`, `gmVisibleOnly`, `revealedAt` to `inventoryItemSchema` in `src/domain/schemas.ts` and `InventoryItem` interface in `src/domain/models.ts`
    - _Requirements: 16.5_
  - [x] 12.2 Add optional `weightCapacity` field to `inventoryContainerSchema` and `InventoryContainer` interface
    - _Requirements: 16.4_
  - [x] 12.3 Write migration `v4 → v5` in `migrations.ts` back-filling new optional inventory fields with `undefined`; bump `STORAGE_VERSION` to 5
    - _Requirements: 26.3_

- [ ] 13. Build nested container UI
  - [x] 13.1 Build `ContainerTree` component — recursive tree render of `InventoryContainer` hierarchy using `parentId`; indented rows; expand/collapse toggle
    - _Requirements: 16.1, 16.2_
  - [x] 13.2 Build `CapacityBar` component — weight progress bar; over-capacity visual state when `weightCapacity` is defined and exceeded
    - _Requirements: 16.4_
  - [x] 13.3 Build `ItemVisibilityBadge` component — cursed / unidentified / locked badge; hidden from player view until `gmVisibleOnly` is false or `revealedAt` is set
    - _Requirements: 16.5_

- [ ] 14. Implement drag-and-drop item movement
  - [x] 14.1 Build `DraggableItemRow` component using the HTML5 drag-and-drop API (`draggable`, `onDragStart`, `onDrop`); on drop call `moveCharacterItem` with the target `containerId`
    - _Requirements: 16.3_
  - [x] 14.2 Add `updateCharacterContainer` action to `inventorySlice` for editing container name/notes/capacity; add `removeCharacterContainer` action that moves orphaned items to `containerId: null`
    - _Requirements: 16.1_

- [ ] 15. Add GM visibility slice actions and UI
  - [x] 15.1 Add `setItemVisibility(characterId, itemId, gmVisibleOnly: boolean)` and `revealItem(characterId, itemId)` actions to `inventorySlice`; `revealItem` sets `gmVisibleOnly: false` and `revealedAt: isoNow()`
    - _Requirements: 16.5, 16.6_
  - [x] 15.2 When a GM reveals an item, push a session log entry via `collaborationService.addSessionLogEntry` with type `'system'` and the item name in the body
    - _Requirements: 16.6_
  - [x] 15.3 Wire `ContainerTree`, `DraggableItemRow`, `CapacityBar`, and `ItemVisibilityBadge` into `InventoryPage` and `InventorySection` on the character sheet
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 16. Checkpoint — Phase 3 complete
  - Ensure all tests pass, ask the user if questions arise.


---

## Phase 4 — Companions, Wild Shape / Polymorph Overlays, HP Pools, Timers

- [ ] 17. Extend companion and wild shape data models
  - [x] 17.1 Add `CompanionTimerState` interface and Zod schema; add `timers: CompanionTimerState[]` to `Companion` model and schema
    - _Requirements: 17.4_
  - [x] 17.2 Add `PolymorphState` interface (extends `ActiveFormState` with `sourceCreatureId`) and Zod schema; add `activePolymorph?: PolymorphState | null` to `Character` model and schema
    - _Requirements: 18.6_
  - [x] 17.3 Write migration `v5 → v6` back-filling `timers: []` on companions and `activePolymorph: null` on characters; bump `STORAGE_VERSION` to 6
    - _Requirements: 26.3_

- [ ] 18. Extend `companionsSlice` with timer and polymorph actions
  - [x] 18.1 Add `addCompanionTimer`, `updateCompanionTimer`, `removeCompanionTimer` actions to `companionsSlice`; validate timer data against Zod schema before write
    - _Requirements: 17.4, 26.1_
  - [x] 18.2 Add `setActivePolymorph(characterId, polymorphState)` and `clearPolymorph(characterId)` actions to `wildShapesSlice`; `clearPolymorph` restores `revertHp` to `combat.hitPoints.current`
    - _Requirements: 18.6_
  - [x] 18.3 Enforce wild shape HP-reaches-zero auto-revert in `updateActiveWildShapeHp`: when `currentHp` would reach 0, call `clearActiveWildShape` and restore `revertHp`
    - _Requirements: 18.4_

- [ ] 19. Build companion UI components
  - [x] 19.1 Build `CompanionCard` component — summary card with HP adjuster, type badge, expand toggle; wire to `updateCompanion`
    - _Requirements: 17.1, 17.2, 17.4_
  - [x] 19.2 Build `CompanionStatBlock` component — full inline-editable `ActorStatBlock` (abilities, AC, HP, speed, actions, traits); wire to `updateCompanion`
    - _Requirements: 17.3, 17.4_
  - [x] 19.3 Wire `CompanionCard` and `CompanionStatBlock` into `CompanionsPage`; add create/delete companion controls; ensure companion deletion cascades when parent character is deleted
    - _Requirements: 17.1, 17.5_
  - [x] 19.4 Add companion spellbook tab to `CompanionsPage` reusing `SpellbookSection` wired to `addCompanionSpell` / `updateCompanionSpell` / `removeCompanionSpell`
    - _Requirements: 17.6_
  - [x] 19.5 Add companion inventory tab to `CompanionsPage` reusing `InventorySection` wired to companion inventory slice actions
    - _Requirements: 17.7_

- [ ] 20. Build wild shape and polymorph overlay components
  - [x] 20.1 Build `WildShapePanel` component — form list with activate/revert controls; wire to `setActiveWildShape`, `clearActiveWildShape`, `addWildShapeForm`, `updateWildShapeForm`, `removeWildShapeForm`
    - _Requirements: 18.1, 18.2, 18.5_
  - [x] 20.2 Build `BeastFormOverlay` component — floating overlay showing active form HP adjuster, stat comparison (AC, speed, retained mental stats); wire to `updateActiveWildShapeHp`
    - _Requirements: 18.2, 18.3, 18.7_
  - [x] 20.3 Build `PolymorphOverlay` component — same model as `BeastFormOverlay` but reads from `character.activePolymorph`; wire to `setActivePolymorph` / `clearPolymorph`
    - _Requirements: 18.6_
  - [x] 20.4 Wire `WildShapePanel`, `BeastFormOverlay`, and `PolymorphOverlay` into `WildShapesPage` and surface active-form indicator on `CharacterSheetPage` header
    - _Requirements: 18.2, 18.7_

- [x] 21. Checkpoint — Phase 4 complete
  - Ensure all tests pass, ask the user if questions arise.


---

## Phase 5 — Floating Compendium Panel, Drag-to-Sheet, Homebrew Authoring

- [ ] 22. Build floating compendium panel infrastructure
  - [x] 22.1 Build `FloatingCompendiumPanel` component — portal-rendered (`createPortal` to `document.body`), draggable via `onMouseDown` + `onMouseMove`, resizable; toggled by a global keyboard shortcut and a toolbar button; hidden when closed
    - _Requirements: 19.1_
  - [x] 22.2 Build `CompendiumShelf` component — pinned entries row at panel top; pin/unpin action writes to `uiPreferences.compendium.pinnedEntries` via `updateUiPreferences`; restored on load
    - _Requirements: 19.4, 19.6_
  - [x] 22.3 Build `CompendiumSearchBar` component — global search input that queries all resource types via `open5eClient.searchResources`; debounced 300 ms; shows loading and error states
    - _Requirements: 19.5, 23.5, 23.6_
  - [x] 22.4 Track recently viewed entries in `uiPreferences.compendium.recentEntries` (max 20); update on entry selection via `updateUiPreferences`
    - _Requirements: 19.3_

- [ ] 23. Implement drag-to-sheet from compendium
  - [x] 23.1 Build `DraggableCompendiumEntry` component — entry card with `draggable` attribute; `onDragStart` encodes entry type and data as `dataTransfer` JSON
    - _Requirements: 19.2_
  - [x] 23.2 Build `DropZone` component — `onDragOver` / `onDrop` handler; decodes `dataTransfer`; routes spell entries to `addCharacterSpell`, item entries to `addCharacterItem`; validates entry against appropriate Zod schema before write
    - _Requirements: 19.2, 26.1_
  - [x] 23.3 Add `DropZone` wrappers to `SpellbookSection` and `InventorySection` on `CharacterSheetPage`
    - _Requirements: 19.2_

- [ ] 24. Homebrew authoring
  - [x] 24.1 Build `HomebrewEditor` component — form covering all 12 homebrew entity types (`homebrewEntityTypes`); validates against `homebrewEntrySchema` before calling `createHomebrew` or `updateHomebrew`; aborts and shows field-level errors on validation failure
    - _Requirements: 20.1, 20.2, 26.1, 26.2_
  - [x] 24.2 Write property test for homebrew schema validation gate
    - **Property 13: Homebrew validation gate** — for any object failing `homebrewEntrySchema.safeParse`, calling `createHomebrew` or `updateHomebrew` leaves the homebrew array unchanged
    - **Validates: Requirements 20.2, 26.1**
    - File: `src/store/slices/homebrewSlice.test.ts`
  - [x] 24.3 Implement `cloneSourceToHomebrew` UI — "Clone to Homebrew" button on compendium entry detail panel; calls `cloneSourceToHomebrew` action; sets `sourceRef.sourceType = 'cloned-from-open5e'`
    - _Requirements: 20.3, 20.4_
  - [x] 24.4 Write property test for homebrew clone source data preservation
    - **Property 14: Homebrew clone preserves source data** — `cloneSourceToHomebrew` result has `sourceData` deeply equal to original `raw` field and `sourceRef.sourceType === 'cloned-from-open5e'`
    - **Validates: Requirements 20.3, 20.4**
    - File: `src/store/slices/homebrewSlice.test.ts`
  - [x] 24.5 Build `HomebrewBadge` component; display it on homebrew entries in `FloatingCompendiumPanel` and `CompendiumPage`
    - _Requirements: 20.5_
  - [x] 24.6 Add homebrew pack export (download all `HomebrewEntry` records as JSON) and import (validate each entry against `homebrewEntrySchema`, reject failures with descriptive error) to `HomebrewPage`
    - _Requirements: 20.6, 20.7_
  - [~] 24.7 Wire `HomebrewEditor` into `HomebrewPage`; list existing entries with edit/delete controls
    - _Requirements: 20.1_

- [x] 25. Checkpoint — Phase 5 complete
  - Ensure all tests pass, ask the user if questions arise.


---

## Phase 6 — Settlement Manager

- [x] 26. Settlement data models, schemas, and migrations
  - [x] 26.1 Add `MapPin`, `SettlementSection`, `Settlement` interfaces to `src/domain/models.ts`; add corresponding Zod schemas to `src/domain/schemas.ts`; add `settlements: Settlement[]` to `PersistedAppData` and `persistedAppDataSchema`
    - _Requirements: 21.1, 21.2_
  - [x] 26.2 Write migration `v6 → v7` back-filling `settlements: []` on existing persisted data; bump `STORAGE_VERSION` to 7
    - _Requirements: 26.3_
  - [x] 26.3 Write SQL migration `202603140004_settlements.sql` — create `settlements` table with RLS (owner can read/write; game members can read published settlements)
    - _Requirements: 21.5, 26.5_

- [x] 27. Create `settlementsSlice`
  - [x] 27.1 Create `src/store/slices/settlementsSlice.ts` with actions: `createSettlement` (initialises all 13 sections), `updateSettlementSection`, `addMapPin`, `removeMapPin`, `publishSettlement`, `deleteSettlement`; validate against Zod schemas before write
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 26.1_
  - [x] 27.2 Add `SettlementsSlice` to `AppStore` type in `types.ts`; wire `createSettlementsSlice` into `useAppStore.ts`
    - _Requirements: 21.1_

- [x] 28. Build settlement UI
  - [x] 28.1 Build `SettlementManagerPage` — list of settlements with create/import/export controls; navigate to `/settlements/:settlementId` on selection; lazy-load via `router.tsx`
    - _Requirements: 21.1, 21.6, 21.7_
  - [x] 28.2 Build `SettlementDetailPage` — tab-based view of all 13 sections; each section rendered by `SettlementSectionCard` with inline-editable `title`, `body`, and `entries` list; debounced auto-save via `updateSettlementSection`
    - _Requirements: 21.2, 21.3_
  - [x] 28.3 Build `InteractiveMapSection` component — SVG/canvas map area; click to place `MapPin`; each pin linked to a Locations section entry; pins rendered as `MapPin` components with label tooltip
    - _Requirements: 21.4_
  - [x] 28.4 Add publish-to-compendium action on `SettlementDetailPage`; calls `publishSettlement` action and upserts to Supabase `settlements` table when configured; published settlements appear in `CompendiumPage` for game members
    - _Requirements: 21.5_
  - [x] 28.5 Add settlement export (download full `Settlement` record as JSON) and import (validate against settlement schema, reject invalid with descriptive error) to `SettlementManagerPage`
    - _Requirements: 21.6, 21.7_
  - [x] 28.6 Add `/settlements` and `/settlements/:settlementId` routes to `router.tsx` with lazy-loaded components
    - _Requirements: 21.1_

- [x] 29. Checkpoint — Phase 6 complete
  - Ensure all tests pass, ask the user if questions arise.


---

## Phase 7 — IndexedDB, PWA/Offline, Playwright E2E, Accessibility, Performance, Print/PDF, Storybook

- [x] 30. Migrate persistence from localStorage to IndexedDB
  - [x] 30.1 Create `src/services/storage/indexedDbService.ts` — transaction-based wrapper around `indexedDB.open`; expose `get(key)`, `set(key, value)`, `delete(key)` with fallback to last known in-memory state on transaction failure
    - _Requirements: 22.1_
  - [x] 30.2 Update `storageService` to use `indexedDbService` as primary storage; on first run, read all existing localStorage data, write to IndexedDB, verify written data, then clear localStorage keys
    - _Requirements: 22.1, 22.2_
  - [x] 30.3 Write migration `v7 → v8` that is a no-op for data shape but triggers the localStorage → IndexedDB copy on first load; bump `STORAGE_VERSION` to 8
    - _Requirements: 22.2, 26.3_

- [x] 31. PWA and Service Worker
  - [x] 31.1 Add `vite-plugin-pwa` (or equivalent) to `vite.config.ts`; configure `manifest.json` with app name, icons, `display: standalone`, and `start_url`
    - _Requirements: 22.5_
  - [x] 31.2 Configure Service Worker to cache all static assets and Open5e API responses; implement network-first strategy for API calls with cache fallback
    - _Requirements: 22.3, 22.4_
  - [x] 31.3 Build `UpdateNotificationBanner` component — shown when a new Service Worker is waiting; "Update" button calls `registration.waiting.postMessage({ type: 'SKIP_WAITING' })` then reloads
    - _Requirements: 22.6_

- [x] 32. Undo stack
  - [x] 32.1 Build `UndoStack` context provider — maintains a ring buffer of the last 50 `PersistedAppData` snapshots; `Ctrl+Z` / `Cmd+Z` keyboard shortcut calls `replaceAllData` with the previous snapshot; expose `pushUndo` function consumed by character sheet and inventory mutation hooks
    - _Requirements: 23.7_
  - [x] 32.2 Wire `pushUndo` into `updateCharacter`, `updateCharacterItem`, `moveCharacterItem`, and `addCharacterItem` store actions via a middleware wrapper in `useAppStore.ts`
    - _Requirements: 23.7_

- [~] 33. Virtual list rendering
  - [x] 33.1 Build `VirtualList` component — wraps a lightweight virtualizer (e.g. `@tanstack/react-virtual`); renders only visible rows for lists with >50 items
    - _Requirements: 23.3_
  - [x] 33.2 Replace plain list renders with `VirtualList` in `CompendiumPage`, `InventorySection`, `SpellbookSection`, and `SettlementManagerPage` wherever item count can exceed 50
    - _Requirements: 23.3_

- [~] 34. Accessibility hardening
  - [x] 34.1 Audit all interactive controls in `CharacterSheetPage`, `CharacterBuilderPage`, `CompanionsPage`, `InventoryPage`, and `FloatingCompendiumPanel` — add missing `aria-label`, `role`, `aria-expanded`, `aria-live` attributes; ensure all controls are keyboard-operable
    - _Requirements: 23.4_
  - [x] 34.2 Add explicit loading skeletons (`aria-busy="true"`) and error states with `role="alert"` for all Open5e and Supabase async operations
    - _Requirements: 23.5, 23.6_

- [~] 35. Print and PDF export
  - [x] 35.1 Add print action button to `CharacterSheetPage` that calls `window.print()`; ensure `print.css` hides nav, action buttons, and non-content UI; conditionally include notes and spellbook sections based on `settings.printOptions`
    - _Requirements: 24.1, 24.2, 24.3, 24.4_

- [~] 36. Playwright E2E tests
  - [x] 36.1 Write Playwright test: full character creation wizard → sheet navigation → HP adjustment → export → import → verify state matches
    - _Requirements: 3.14, 10.5_
  - [x] 36.2 Write Playwright test: GM creates game → player joins via code → character published → GM sees character bundle in `GameDetailPage`
    - _Requirements: 13.4, 14.3, 15.2_
  - [x] 36.3 Write Playwright test: disable network via `page.route('**', route => route.abort())` → app renders from Service Worker cache → re-enable → sync resumes
    - _Requirements: 22.3, 22.4_

- [~] 37. Storybook setup
  - [x] 37.1 Add Storybook with `@storybook/react-vite`; write stories for `AbilityScoreGrid`, `CombatBlock`, `InventorySection`, `CompanionCard`, `FloatingCompendiumPanel`, `VirtualList`, and `UpdateNotificationBanner`
    - _Requirements: 1.1_

- [x] 38. Final checkpoint — Phase 7 complete
  - Ensure all tests pass, bundle size stays within 250 kB JS / 20 kB CSS gzipped, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP iteration.
- Each task references specific requirements for traceability.
- Checkpoints ensure incremental validation after each phase.
- Property tests use **fast-check** with a minimum of 100 iterations (`{ numRuns: 200 }` for critical properties P1–P4).
- Each property test file must include the comment tag: `// Feature: codex-arcanum, Property N: <property_text>`
- All new Zustand slice files follow the existing pattern in `src/store/slices/`; slices never import from each other.
- All persisted writes must pass Zod `safeParse` before the write is committed; failures are logged and the write is aborted.
- GM-only data fields (`gmVisibleOnly`, `cursed` before reveal, session log GM notes) must never appear in Supabase player-facing realtime payloads.
- Lists with >50 items must use `VirtualList` (Phase 7 component, can be back-ported earlier if needed).

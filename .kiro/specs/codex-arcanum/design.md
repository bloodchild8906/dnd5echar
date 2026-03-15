# Design Document — Codex Arcanum

## Overview

Codex Arcanum is a local-first D&D 5e character management platform built on React 19, TypeScript strict mode, Vite, Zustand (slice pattern), Zod, and React Router 7. Supabase provides optional cloud sync, auth, and realtime collaboration; all Supabase features degrade gracefully when environment variables are absent.

The application is delivered as a single-page application (SPA) and, in Phase 7, as an installable PWA. All persisted data is Zod-validated and migration-backed. The seven phases build incrementally on a stable core:

| Phase | Theme |
|-------|-------|
| 1 | Character sheet completeness, builder polish, persistence hardening, Open5e caching |
| 2 | Supabase auth, games/memberships, realtime sync, session logs |
| 3 | Nested inventory, drag-and-drop, GM visibility controls |
| 4 | Companions, wild shape/polymorph overlays, HP pools |
| 5 | Floating compendium panel, drag-to-sheet, homebrew authoring |
| 6 | Settlement manager route, 13 sections, map pins, publish to compendium |
| 7 | IndexedDB, PWA/offline, Playwright E2E, accessibility, performance, print/PDF, Storybook |

---

## Architecture

### High-Level Layers

```
┌─────────────────────────────────────────────────────────┐
│                     React UI Layer                       │
│  features/*  components/common  components/layout        │
└────────────────────────┬────────────────────────────────┘
                         │ hooks / context
┌────────────────────────▼────────────────────────────────┐
│                   Zustand AppStore                        │
│  slices: characters · companions · inventory · spells    │
│          wildShapes · notes · homebrew · reference       │
│          settings · ui · core                            │
└──────┬──────────────────────────────────────┬───────────┘
       │ storageService                        │ supabaseSyncService
┌──────▼──────────┐                  ┌────────▼──────────┐
│  localStorage   │                  │  Supabase (opt.)  │
│  (→ IndexedDB   │                  │  auth · snapshots │
│   in Phase 7)   │                  │  games · realtime │
└─────────────────┘                  └───────────────────┘
       │ open5eClient
┌──────▼──────────┐
│  Open5e API     │
│  + ReferenceCache│
└─────────────────┘
```

### Data Flow

1. On mount, `storageService.loadAppData()` runs the `MigrationRunner` synchronously and seeds the Zustand store.
2. Every store mutation triggers a debounced `storageService.saveAppData()` via the store subscriber in `useAppStore.ts`.
3. Open5e fetches are cached in `referenceCache` (part of `PersistedAppData`) keyed by resource + params.
4. When Supabase is configured and the user is authenticated, `useSupabaseAutoSync` pushes/pulls snapshots on a configurable interval.
5. Realtime character updates (Phase 2+) flow through Supabase Realtime channels into the store via `collaborationService`.

### Routing

All routes are lazy-loaded via `React.lazy` inside `createBrowserRouter`. The `AppShell` layout wraps all routes. Character-scoped routes follow the pattern `/characters/:characterId/<tab>`.

New routes added across phases:

| Phase | Route | Component |
|-------|-------|-----------|
| 6 | `/settlements` | `SettlementManagerPage` |
| 6 | `/settlements/:settlementId` | `SettlementDetailPage` |

---

## Components and Interfaces

### Existing Component Inventory (Phase 1 baseline)

```
src/components/
  common/
    Badge.tsx
    EmptyState.tsx
    NumberAdjuster.tsx
    SearchBar.tsx
    SectionCard.tsx
    TagInput.tsx
  layout/
    AppShell.tsx
    CharacterTabs.tsx
    NavSidebar.tsx
```

### Phase 1 — Character Sheet Completeness

The `CharacterSheetPage` is extended with fully inline-editable sections. Each section is a `SectionCard` with controlled inputs wired to `updateCharacter` patch functions.

New sub-components:

| Component | Responsibility |
|-----------|---------------|
| `AbilityScoreGrid` | Renders 6 ability tiles with score/modifier/save, inline editable |
| `SkillList` | 18 skills with proficiency toggle (none/proficient/expertise) |
| `CombatBlock` | AC, initiative, speed, HP adjuster, death saves, inspiration |
| `SpellbookSection` | Slot grid, spell lists (prepared/known/innate/item), pact magic |
| `InventorySection` | Container tree, item rows, currency wallet, weight bar |
| `FeaturesSection` | Features and actions list, inline add/edit/delete |
| `ConditionsBar` | Tag-input for conditions |
| `OverrideIndicator` | Badge shown when a `ManualOverride` is active |

### Phase 2 — GM / Collaboration UI

| Component | Responsibility |
|-----------|---------------|
| `GamesPage` | List games, create game, join by code |
| `GameDetailPage` | Members list, invite controls, character bundles |
| `SessionLogPanel` | Timestamped log entries, GM note input |
| `PermissionEditor` | Role selector + per-permission toggles for a membership |
| `RealtimeSyncIndicator` | Connection status badge in AppShell header |

### Phase 3 — Nested Inventory

| Component | Responsibility |
|-----------|---------------|
| `ContainerTree` | Recursive tree render of `InventoryContainer` hierarchy |
| `DraggableItemRow` | Item row with drag handle; uses HTML5 drag-and-drop API |
| `CapacityBar` | Weight progress bar, over-capacity state |
| `ItemVisibilityBadge` | Cursed / unidentified / locked badge (GM-only until revealed) |

### Phase 4 — Companions and Wild Shape

| Component | Responsibility |
|-----------|---------------|
| `CompanionCard` | Summary card with HP adjuster and expand toggle |
| `CompanionStatBlock` | Full inline-editable `ActorStatBlock` |
| `WildShapePanel` | Form list, activate/revert controls |
| `BeastFormOverlay` | Floating overlay showing active form HP, stat comparison |
| `PolymorphOverlay` | Same model as BeastFormOverlay, any creature stat block |

### Phase 5 — Floating Compendium

| Component | Responsibility |
|-----------|---------------|
| `FloatingCompendiumPanel` | Draggable/resizable panel, portal-rendered |
| `CompendiumShelf` | Pinned entries row at panel top |
| `CompendiumSearchBar` | Global search across all resource types |
| `DraggableCompendiumEntry` | Entry card with drag source for drop-to-sheet |
| `DropZone` | Drop target on sheet sections (spellbook, inventory, etc.) |
| `HomebrewEditor` | Form for all 12 homebrew entity types |
| `HomebrewBadge` | Visual distinction for homebrew entries in compendium |

### Phase 6 — Settlement Manager

| Component | Responsibility |
|-----------|---------------|
| `SettlementManagerPage` | List of settlements, create/import/export |
| `SettlementDetailPage` | Tab-based view of all 13 sections |
| `SettlementSectionCard` | Generic inline-editable section card |
| `InteractiveMapSection` | SVG/canvas map with pin placement |
| `MapPin` | Clickable pin linked to a Location/POI entry |

### Phase 7 — PWA / Accessibility

| Component | Responsibility |
|-----------|---------------|
| `UpdateNotificationBanner` | Service Worker update prompt |
| `VirtualList` | Windowed list for >50 items (wraps a lightweight virtualizer) |
| `UndoStack` | Context provider + keyboard shortcut handler for Ctrl+Z |

---

## Data Models

### Existing Core Models (src/domain/models.ts)

The following types are already defined and stable:

- `Character` — full player character record
- `Companion` — familiar/pet/summoned/mount/npc-follower
- `WildShapeForm` / `ActiveFormState`
- `InventoryItem` / `InventoryContainer` / `CompanionInventory`
- `CharacterSpellbook` / `SpellPreparationState` / `SpellSlotState`
- `HomebrewEntry`
- `Note` / `NoteSection`
- `PersistedAppData` / `ImportExportBundle` / `BackupSnapshot`
- `AppSettings` / `UiPreferences`
- `ReferenceCacheState` / `ReferenceCacheEntry`

### Phase 2 — Collaboration Models (src/domain/collaboration.ts — already exists)

```typescript
// Already defined:
type GameRole = 'gm' | 'assistant_gm' | 'player' | 'viewer';
interface GamePermissionSet { canViewCharacters, canEditCharacters, canManagePlayers }
interface GameRecord { id, gmUserId, name, joinCode, createdAt, updatedAt }
interface GameMembership { id, gameId, userId, role, permissions, createdAt, updatedAt }
interface CharacterBundle { character, companions, notes }
interface CharacterBundleRecord { id, name, ownerUserId, gameId, bundle, createdAt, updatedAt }
```

New additions for Phase 2:

```typescript
interface SessionLogEntry {
  id: string;
  gameId: string;
  authorUserId: string;
  authorDisplayName: string;
  type: 'character_update' | 'hp_change' | 'gm_note' | 'system';
  body: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface InviteToken {
  id: string;
  gameId: string;
  token: string;
  role: GameRole;
  usedAt?: string | null;
  expiresAt: string;
  createdAt: string;
}
```

### Phase 3 — Extended Inventory Models

Additions to `InventoryItem` (new optional fields):

```typescript
interface InventoryItemExtended extends InventoryItem {
  cursed?: boolean;
  identified?: boolean;       // false = unidentified
  locked?: boolean;
  gmVisibleOnly?: boolean;    // true until GM reveals
  revealedAt?: string | null;
}
```

`InventoryContainer` gains a `weightCapacity` optional field:

```typescript
interface InventoryContainerExtended extends InventoryContainer {
  weightCapacity?: number;    // undefined = unlimited
}
```

### Phase 4 — Companion / Wild Shape Extensions

`Companion` already has `stats: ActorStatBlock`, `inventory`, and `spellbook`. Phase 4 adds:

```typescript
interface CompanionTimerState {
  companionId: string;
  label: string;
  durationRounds: number;
  elapsedRounds: number;
  startedAt: string;
}
```

`ActiveFormState` already exists. Phase 4 adds a `PolymorphState` (same shape, stored separately):

```typescript
interface PolymorphState extends ActiveFormState {
  sourceCreatureId: string;   // references a ReferenceCreature or HomebrewEntry
}
```

### Phase 6 — Settlement Models

```typescript
type SettlementSectionType =
  | 'overview' | 'demographics' | 'economy' | 'government' | 'religion'
  | 'locations' | 'map' | 'npcs' | 'factions' | 'job-board'
  | 'events' | 'timeline' | 'lore';

interface MapPin {
  id: string;
  locationId: string;   // references a locations section entry
  x: number;           // 0–100 percentage of map width
  y: number;           // 0–100 percentage of map height
  label: string;
}

interface SettlementSection {
  id: string;
  type: SettlementSectionType;
  title: string;
  body: string;
  entries: Array<{ id: string; name: string; description: string }>;
  mapPins?: MapPin[];
  updatedAt: string;
}

interface Settlement {
  id: string;
  name: string;
  gameId?: string | null;
  publishedToCompendium: boolean;
  sections: SettlementSection[];
  createdAt: string;
  updatedAt: string;
}
```

`PersistedAppData` gains a `settlements` array in Phase 6.

### Zustand Store Extensions

Each phase adds slice actions following the existing pattern in `src/store/slices/`:

| Phase | New slice actions |
|-------|------------------|
| 2 | `gamesSlice`: createGame, joinGame, listGames, updateMembership |
| 3 | `inventorySlice`: setItemVisibility, revealItem, setContainerCapacity |
| 4 | `companionsSlice`: setActivePolymorph, clearPolymorph, addCompanionTimer |
| 6 | `settlementsSlice`: createSettlement, updateSettlementSection, addMapPin, publishSettlement |

### Supabase Schema Extensions

Phase 2 adds to the existing migrations:

```sql
-- session_log_entries table
create table public.session_log_entries (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  author_user_id uuid not null references auth.users(id),
  type text not null,
  body text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- invite_tokens table
create table public.invite_tokens (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  token text not null unique,
  role text not null,
  used_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
```

Phase 6 adds:

```sql
create table public.settlements (
  id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid references public.games(id) on delete set null,
  name text not null,
  published boolean not null default false,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Migration produces valid output

*For any* raw persisted data object at any schema version N ≤ current, running `migratePersistedAppData` on it should produce a value that passes `persistedAppDataSchema.safeParse` without errors.

**Validates: Requirements 2.4, 2.5, 2.6**

### Property 2: Serialization round-trip

*For any* valid `PersistedAppData` object, calling `storageService.serializeBundle` then `storageService.parseImportBundle` then `migratePersistedAppData` should produce a value deeply equal to the original.

**Validates: Requirements 2.8, 10.5**

### Property 3: Export/import round-trip

*For any* valid `PersistedAppData` bundle, exporting it via `storageService.exportBundle` and then importing it via `storageService.parseImportBundle` should produce an object whose `characters`, `companions`, `notes`, and `homebrew` arrays are deeply equal to the originals.

**Validates: Requirements 10.5**

### Property 4: Snapshot round-trip

*For any* valid `PersistedAppData` state, creating a `BackupSnapshot` via `storageService.createBackupSnapshot` and then restoring it via `storageService.restoreBackup` should produce a value deeply equal to the original state.

**Validates: Requirements 25.5**

### Property 5: Ability score modifier formula

*For any* integer score in [1, 30], `getAbilityModifier` should return `Math.floor((score - 10) / 2)`.

**Validates: Requirements 12.3**

### Property 6: Proficiency bonus formula

*For any* character level in [1, 20], `getProficiencyBonus` should return `Math.max(2, Math.ceil(1 + level / 4))`.

**Validates: Requirements 4.5, 12.4**

### Property 7: Point buy cost schedule and budget invariant

*For any* set of six ability scores each in [8, 15], the total point-buy cost computed by `getPointBuyTotal` should equal the sum of individual costs where cost(s) = s − 8 for s ∈ [8,13], 7 for s = 14, and 9 for s = 15. Furthermore, a valid point-buy assignment must have total cost ≤ 27.

**Validates: Requirements 3.8, 12.5**

### Property 8: Standard array assignment preserves multiset

*For any* standard array assignment produced by `assignStandardArrayScore`, the multiset of the six resulting scores should equal {15, 14, 13, 12, 10, 8} with no duplicates.

**Validates: Requirements 12.6**

### Property 9: Spell save DC and attack bonus derivation

*For any* character, `getSpellSaveDc` should return `8 + getProficiencyBonus(character) + getAbilityModifier(character, character.spellbook.spellcastingAbility)` unless a manual override is active, and `getSpellAttackBonus` should return `getProficiencyBonus(character) + getAbilityModifier(character, character.spellbook.spellcastingAbility)` unless overridden.

**Validates: Requirements 12.7**

### Property 10: Derived stats idempotence

*For any* valid `Character` object, calling any derived stat function (e.g. `getAbilityModifier`, `getProficiencyBonus`, `getArmorClass`, `getSpellSaveDc`) twice with the same input should return the same value — i.e. derived functions are pure and have no side effects.

**Validates: Requirements 12.8**

### Property 11: HP clamping invariant

*For any* character and any HP delta applied via the store, the resulting `combat.hitPoints.current` should satisfy `0 ≤ current ≤ max + temp`.

**Validates: Requirements 5.2**

### Property 12: Carry capacity formula

*For any* character, `getCarryCapacity` should return `getAbilityTotal(character, 'strength') * 15`.

**Validates: Requirements 7.6**

### Property 13: Homebrew schema validation gate

*For any* object that fails `homebrewEntrySchema.safeParse`, attempting to persist it via `createHomebrew` or `updateHomebrew` should leave the homebrew array unchanged.

**Validates: Requirements 20.2, 26.1**

### Property 14: Homebrew clone preserves source data

*For any* Open5e reference entry cloned via `cloneSourceToHomebrew`, the resulting `HomebrewEntry.sourceData` should deeply equal the original reference entry's `raw` field, and `sourceRef.sourceType` should equal `'cloned-from-open5e'`.

**Validates: Requirements 20.3, 20.4**

---

## Error Handling

### Persistence Layer

- `storageService.loadAppData` catches all exceptions and falls back to `createSeedPersistedAppData()`.
- `migratePersistedAppData` catches Zod parse failures and returns seed data.
- `storageService.saveAppData` is wrapped in a try/catch; failures are logged but do not throw to the UI.
- Phase 7: IndexedDB operations use a transaction-based wrapper; on failure the app falls back to the last known good in-memory state.

### Open5e Client

- `fetchJson` throws on non-2xx responses; callers catch and surface an error string via `useOpen5eResource`.
- When offline and cache exists: return cached result.
- When offline and no cache: return `{ count: 0, results: [] }` and set `error = 'offline'`.
- The `useOpen5eResource` hook exposes `{ items, loading, error }` — all consumers must handle all three states.

### Supabase

- All Supabase calls are wrapped in try/catch; errors are surfaced via toast notifications, not thrown to React error boundaries.
- When `isSupabaseConfigured()` returns false, all Supabase-dependent UI is hidden and no calls are made.
- Realtime disconnection triggers a `reconnecting` indicator; the channel is re-subscribed automatically on reconnect.
- RLS policy violations return a 403; the app displays "Permission denied" and does not corrupt local state.

### Zod Validation

- All writes to any persistence layer (localStorage, IndexedDB, Supabase) are preceded by a `schema.safeParse`. On failure, the write is aborted and the error is logged to the console.
- Import operations surface Zod errors as human-readable messages listing the failing fields.

### Wild Shape / Polymorph

- When `activeForm.currentHp` reaches 0, the store automatically calls `clearActiveWildShape` and restores `revertHp` — this is an invariant enforced in `updateActiveWildShapeHp`.

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:

- **Unit tests** cover specific examples, integration points, edge cases, and error conditions.
- **Property tests** verify universal invariants across randomly generated inputs.

### Property-Based Testing Library

The project uses **fast-check** (`npm install --save-dev fast-check`) for property-based testing, integrated with Vitest.

Each property test must:
- Run a minimum of **100 iterations** (fast-check default is 100; increase with `{ numRuns: 200 }` for critical properties).
- Include a comment tag in the format: `// Feature: codex-arcanum, Property N: <property_text>`

### Unit Test Coverage Targets

| Domain | Target |
|--------|--------|
| `src/domain/derived.ts` | 100% line coverage |
| `src/services/storage/migrations.ts` | 100% line coverage |
| `src/services/storage/storageService.ts` | ≥ 90% line coverage |
| `src/features/characters/builderMath.ts` | 100% line coverage |
| `src/store/slices/*` | ≥ 80% line coverage |

### Property Test Mapping

| Property | Test file | fast-check arbitraries |
|----------|-----------|----------------------|
| P1: Migration valid output | `migrations.test.ts` | `fc.record({ version: fc.integer({min:1,max:2}), ... })` |
| P2: Serialization round-trip | `storageService.test.ts` | `fc.record(persistedAppDataArb)` |
| P3: Export/import round-trip | `storageService.test.ts` | `fc.record(persistedAppDataArb)` |
| P4: Snapshot round-trip | `storageService.test.ts` | `fc.record(persistedAppDataArb)` |
| P5: Ability modifier formula | `derived.test.ts` | `fc.integer({min:1,max:30})` |
| P6: Proficiency bonus formula | `derived.test.ts` | `fc.integer({min:1,max:20})` |
| P7: Point buy cost + budget | `builderMath.test.ts` | `fc.array(fc.integer({min:8,max:15}), {minLength:6,maxLength:6})` |
| P8: Standard array multiset | `builderMath.test.ts` | `fc.shuffledSubarray([15,14,13,12,10,8])` |
| P9: Spell DC/attack derivation | `derived.test.ts` | `fc.record(characterArb)` |
| P10: Derived stats idempotence | `derived.test.ts` | `fc.record(characterArb)` |
| P11: HP clamping invariant | `charactersSlice.test.ts` | `fc.record(characterArb)`, `fc.integer()` |
| P12: Carry capacity formula | `derived.test.ts` | `fc.record(characterArb)` |
| P13: Homebrew validation gate | `homebrewSlice.test.ts` | `fc.anything()` |
| P14: Homebrew clone source data | `homebrewSlice.test.ts` | `fc.record(referenceOptionArb)` |

### Unit Test Examples (non-property)

- Death save state: character with 3 failures → `isDead` flag; 3 successes → `isStable` flag.
- Migration v1→v2→v3: given a v1 fixture, output passes `persistedAppDataSchema`.
- Import validation: malformed JSON → error message, store unchanged.
- Supabase absent: `isSupabaseConfigured()` returns false → no Supabase calls made.
- Wild shape revert: when form HP hits 0, `activeForm` is null and `combat.hitPoints.current` equals `revertHp`.

### End-to-End Tests (Phase 7 — Playwright)

- Full character creation wizard → sheet navigation → HP adjustment → export → import → verify state.
- GM creates game → player joins via code → character published → GM sees character bundle.
- Offline mode: disable network → app renders from Service Worker cache → re-enable → sync resumes.

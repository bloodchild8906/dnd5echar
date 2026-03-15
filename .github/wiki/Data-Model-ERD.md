# Data Model ERD

This page shows the current high-level data model for Codex Arcanum.

## Application Model

```mermaid
erDiagram
  APP_STATE ||--o{ CHARACTER : stores
  APP_STATE ||--o{ COMPANION : stores
  APP_STATE ||--o{ NOTE : stores
  APP_STATE ||--o{ HOMEBREW_ENTRY : stores
  APP_STATE ||--o{ REFERENCE_CACHE_ENTRY : caches
  APP_STATE ||--|| APP_SETTINGS : configures
  APP_STATE ||--|| UI_PREFERENCES : stores

  CHARACTER ||--|| CHARACTER_SPELLBOOK : has
  CHARACTER ||--|| INVENTORY : carries
  CHARACTER ||--o{ TRAIT_ENTRY : features
  CHARACTER ||--o{ ACTION_ENTRY : actions
  CHARACTER ||--o{ WILD_SHAPE_FORM : library
  CHARACTER ||--o{ COMPANION : owns

  COMPANION ||--|| ACTOR_STAT_BLOCK : uses
  COMPANION ||--|| INVENTORY : carries
  COMPANION ||--|| CHARACTER_SPELLBOOK : casts

  INVENTORY ||--o{ INVENTORY_CONTAINER : groups
  INVENTORY ||--o{ INVENTORY_ITEM : stores

  CHARACTER_SPELLBOOK ||--o{ SPELL_SLOT_STATE : tracks
  CHARACTER_SPELLBOOK ||--o{ SPELL_PREPARATION_STATE : stores
  SPELL_PREPARATION_STATE ||--|| SPELL : wraps
```

## Supabase Storage Model

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : owns
  AUTH_USERS ||--|| APP_SNAPSHOTS : persists
  AUTH_USERS ||--o{ GAMES : runs
  AUTH_USERS ||--o{ GAME_MEMBERSHIPS : joins
  GAMES ||--o{ GAME_MEMBERSHIPS : has
  AUTH_USERS ||--o{ CHARACTER_BUNDLES : owns
  GAMES o|--o{ CHARACTER_BUNDLES : publishes

  PROFILES {
    uuid user_id PK
    text email
    text display_name
    timestamptz created_at
    timestamptz updated_at
  }

  APP_SNAPSHOTS {
    uuid user_id PK
    jsonb payload
    timestamptz updated_at
  }

  GAMES {
    uuid id PK
    uuid gm_user_id FK
    text name
    text join_code
    timestamptz created_at
    timestamptz updated_at
  }

  GAME_MEMBERSHIPS {
    uuid id PK
    uuid game_id FK
    uuid user_id FK
    text role
    jsonb permissions
    timestamptz created_at
    timestamptz updated_at
  }

  CHARACTER_BUNDLES {
    text id PK
    text name
    uuid owner_user_id FK
    uuid game_id FK
    jsonb bundle
    timestamptz created_at
    timestamptz updated_at
  }
```

## Notes

- `APP_STATE` is the persisted workspace shape selected by `selectPersistedAppData`.
- `APP_SNAPSHOTS.payload` stores the full workspace snapshot currently used for Supabase bootstrap.
- `CHARACTER_BUNDLES` is the more granular Supabase model already present for game-scoped character distribution.

## Related Pages

- [[Architecture Overview]]
- [[Cloud Sync]]
- [[Roadmap]]

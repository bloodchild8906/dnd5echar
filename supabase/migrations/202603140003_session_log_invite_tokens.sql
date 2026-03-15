-- session_log_entries: timestamped log entries for a game session
create table if not exists public.session_log_entries (
  id              uuid        primary key default gen_random_uuid(),
  game_id         uuid        not null references public.games(id) on delete cascade,
  author_user_id  uuid        not null references auth.users(id),
  entry_type      text        not null check (entry_type in ('gm-note', 'system', 'player-action', 'combat')),
  body            text        not null default '',
  is_gm_only      boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- invite_tokens: one-time tokens for joining a game via shareable link
create table if not exists public.invite_tokens (
  id                  uuid        primary key default gen_random_uuid(),
  game_id             uuid        not null references public.games(id) on delete cascade,
  token               text        not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by_user_id  uuid        not null references auth.users(id),
  expires_at          timestamptz not null default (now() + interval '7 days'),
  used_at             timestamptz,
  used_by_user_id     uuid        references auth.users(id),
  created_at          timestamptz not null default now()
);

-- Indexes
create index if not exists session_log_entries_game_id_created_at_idx
  on public.session_log_entries (game_id, created_at);

create index if not exists invite_tokens_token_idx
  on public.invite_tokens (token);

create index if not exists invite_tokens_game_id_idx
  on public.invite_tokens (game_id);

-- Enable RLS
alter table public.session_log_entries enable row level security;
alter table public.invite_tokens enable row level security;

-- Helper: check if the current user is a GM or Co-GM of a game
create or replace function public.is_gm_or_co_gm(target_game uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_memberships gm
    where gm.game_id = target_game
      and gm.user_id = auth.uid()
      and gm.role in ('gm', 'assistant_gm')
  );
$$;

-- RLS policies for session_log_entries

-- SELECT: game members can read non-gm-only entries; GM/Co-GM can read all entries
create policy if not exists "session_log_select_members"
  on public.session_log_entries
  for select
  using (
    -- GM or Co-GM can see everything including gm-only entries
    public.is_gm_or_co_gm(game_id)
    or (
      -- Regular members can only see non-gm-only entries
      is_gm_only = false
      and exists (
        select 1
        from public.game_memberships gm
        where gm.game_id = session_log_entries.game_id
          and gm.user_id = auth.uid()
      )
    )
  );

-- INSERT: only GM and Co-GM can insert session log entries
create policy if not exists "session_log_insert_gm_co_gm"
  on public.session_log_entries
  for insert
  with check (
    author_user_id = auth.uid()
    and public.is_gm_or_co_gm(game_id)
  );

-- RLS policies for invite_tokens

-- SELECT: only the game owner (gm_user_id) can read tokens for their games
create policy if not exists "invite_tokens_select_owner"
  on public.invite_tokens
  for select
  using (
    exists (
      select 1
      from public.games g
      where g.id = invite_tokens.game_id
        and g.gm_user_id = auth.uid()
    )
  );

-- INSERT: only the game owner can insert invite tokens
create policy if not exists "invite_tokens_insert_owner"
  on public.invite_tokens
  for insert
  with check (
    created_by_user_id = auth.uid()
    and exists (
      select 1
      from public.games g
      where g.id = invite_tokens.game_id
        and g.gm_user_id = auth.uid()
    )
  );

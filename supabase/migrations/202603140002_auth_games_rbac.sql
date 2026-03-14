create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  gm_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  join_code text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.game_memberships (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('gm', 'assistant_gm', 'player', 'viewer')),
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (game_id, user_id)
);

create table if not exists public.character_bundles (
  id text primary key,
  name text not null,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  game_id uuid references public.games (id) on delete set null,
  bundle jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.can_manage_players(target_game uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.games g
    left join public.game_memberships gm on gm.game_id = g.id and gm.user_id = auth.uid()
    where g.id = target_game
      and (
        g.gm_user_id = auth.uid()
        or coalesce((gm.permissions ->> 'canManagePlayers')::boolean, false) = true
        or gm.role = 'assistant_gm'
      )
  );
$$;

create or replace function public.can_view_game_characters(target_game uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.games g
    left join public.game_memberships gm on gm.game_id = g.id and gm.user_id = auth.uid()
    where g.id = target_game
      and (
        g.gm_user_id = auth.uid()
        or gm.user_id = auth.uid()
        or coalesce((gm.permissions ->> 'canViewCharacters')::boolean, false) = true
      )
  );
$$;

create or replace function public.can_edit_game_characters(target_game uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.games g
    left join public.game_memberships gm on gm.game_id = g.id and gm.user_id = auth.uid()
    where g.id = target_game
      and (
        g.gm_user_id = auth.uid()
        or gm.role = 'assistant_gm'
        or coalesce((gm.permissions ->> 'canEditCharacters')::boolean, false) = true
      )
  );
$$;

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_memberships enable row level security;
alter table public.character_bundles enable row level security;

create policy if not exists "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy if not exists "profiles_upsert_own"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "games_select_members"
  on public.games
  for select
  using (
    gm_user_id = auth.uid()
    or exists (
      select 1 from public.game_memberships gm where gm.game_id = id and gm.user_id = auth.uid()
    )
  );

create policy if not exists "games_insert_gm"
  on public.games
  for insert
  with check (gm_user_id = auth.uid());

create policy if not exists "games_update_gm"
  on public.games
  for update
  using (gm_user_id = auth.uid())
  with check (gm_user_id = auth.uid());

create policy if not exists "games_delete_gm"
  on public.games
  for delete
  using (gm_user_id = auth.uid());

create policy if not exists "memberships_select_members"
  on public.game_memberships
  for select
  using (
    user_id = auth.uid()
    or public.can_manage_players(game_id)
    or exists (
      select 1 from public.game_memberships self where self.game_id = game_id and self.user_id = auth.uid()
    )
  );

create policy if not exists "memberships_insert_self_or_manager"
  on public.game_memberships
  for insert
  with check (
    user_id = auth.uid()
    or public.can_manage_players(game_id)
  );

create policy if not exists "memberships_update_manager"
  on public.game_memberships
  for update
  using (public.can_manage_players(game_id))
  with check (public.can_manage_players(game_id));

create policy if not exists "memberships_delete_manager"
  on public.game_memberships
  for delete
  using (public.can_manage_players(game_id));

create policy if not exists "bundles_select_visible"
  on public.character_bundles
  for select
  using (
    owner_user_id = auth.uid()
    or (game_id is not null and public.can_view_game_characters(game_id))
  );

create policy if not exists "bundles_insert_owner_or_editor"
  on public.character_bundles
  for insert
  with check (
    owner_user_id = auth.uid()
    or (game_id is not null and public.can_edit_game_characters(game_id))
  );

create policy if not exists "bundles_update_owner_or_editor"
  on public.character_bundles
  for update
  using (
    owner_user_id = auth.uid()
    or (game_id is not null and public.can_edit_game_characters(game_id))
  )
  with check (
    owner_user_id = auth.uid()
    or (game_id is not null and public.can_edit_game_characters(game_id))
  );

create policy if not exists "bundles_delete_owner_or_editor"
  on public.character_bundles
  for delete
  using (
    owner_user_id = auth.uid()
    or (game_id is not null and public.can_edit_game_characters(game_id))
  );

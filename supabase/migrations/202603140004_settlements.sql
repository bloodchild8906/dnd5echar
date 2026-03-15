create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  game_id uuid references public.games (id) on delete set null,
  name text not null,
  description text not null default '',
  sections jsonb not null default '[]'::jsonb,
  map_pins jsonb not null default '[]'::jsonb,
  map_image_url text,
  published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.settlements enable row level security;

-- Owner can read their own settlements
create policy if not exists "settlements_select_owner"
  on public.settlements
  for select
  using (owner_user_id = auth.uid());

-- Game members can read published settlements in games they belong to
create policy if not exists "settlements_select_game_members"
  on public.settlements
  for select
  using (
    published = true
    and game_id is not null
    and exists (
      select 1
      from public.game_memberships gm
      where gm.game_id = settlements.game_id
        and gm.user_id = auth.uid()
    )
  );

-- Owner can insert their own settlements
create policy if not exists "settlements_insert_owner"
  on public.settlements
  for insert
  with check (owner_user_id = auth.uid());

-- Owner can update their own settlements
create policy if not exists "settlements_update_owner"
  on public.settlements
  for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- Owner can delete their own settlements
create policy if not exists "settlements_delete_owner"
  on public.settlements
  for delete
  using (owner_user_id = auth.uid());

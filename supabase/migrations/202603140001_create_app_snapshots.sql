create table if not exists public.app_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_snapshots enable row level security;

create policy if not exists "users_can_read_own_snapshots"
  on public.app_snapshots
  for select
  using (auth.uid() = user_id);

create policy if not exists "users_can_insert_own_snapshots"
  on public.app_snapshots
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "users_can_update_own_snapshots"
  on public.app_snapshots
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

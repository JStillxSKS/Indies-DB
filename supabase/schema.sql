-- Smash Indies Library schema
-- Run in Supabase SQL Editor after creating project

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.maps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null default '',
  charter text not null default '',
  mapper_id uuid not null references auth.users (id) on delete cascade,
  file_path text not null,
  cover_path text,
  bpm_est numeric,
  difficulties jsonb not null default '{"easy":0,"normal":0,"hard":0,"extreme":0}'::jsonb,
  downloads integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists maps_created_at_idx on public.maps (created_at desc);
create index if not exists maps_downloads_idx on public.maps (downloads desc);
create index if not exists maps_title_idx on public.maps using gin (to_tsvector('english', title || ' ' || artist || ' ' || charter));

alter table public.profiles enable row level security;
alter table public.maps enable row level security;

-- Profiles
create policy "profiles_public_read" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Maps: public read, auth write own
create policy "maps_public_read" on public.maps for select using (true);
create policy "maps_insert_own" on public.maps for insert with check (auth.uid() = mapper_id);
create policy "maps_update_own" on public.maps for update using (auth.uid() = mapper_id);
create policy "maps_delete_own" on public.maps for delete using (auth.uid() = mapper_id);

-- Increment download count (callable by anyone)
create or replace function public.increment_download(map_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.maps set downloads = downloads + 1 where id = map_id;
end;
$$;

grant execute on function public.increment_download(uuid) to anon, authenticated;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket (run in dashboard or via API):
-- Name: indies
-- Public: true for reads
-- Policies: authenticated users can upload to maps/{user_id}/
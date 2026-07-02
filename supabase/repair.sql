-- Safe to re-run after a partial wipe or duplicate policy errors.
-- Run this in Supabase SQL Editor instead of re-running schema.sql from scratch.

-- Drop existing policies (ignore if missing)
drop policy if exists "profiles_public_read" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "maps_public_read" on public.maps;
drop policy if exists "maps_insert_own" on public.maps;
drop policy if exists "maps_update_own" on public.maps;
drop policy if exists "maps_delete_own" on public.maps;

drop policy if exists "indies_auth_upload" on storage.objects;
drop policy if exists "indies_public_read" on storage.objects;
drop policy if exists "indies_auth_delete_own" on storage.objects;

-- Tables
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

-- Profiles policies
create policy "profiles_public_read" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Maps policies
create policy "maps_public_read" on public.maps for select using (true);
create policy "maps_insert_own" on public.maps for insert with check (auth.uid() = mapper_id);
create policy "maps_update_own" on public.maps for update using (auth.uid() = mapper_id);
create policy "maps_delete_own" on public.maps for delete using (auth.uid() = mapper_id);

-- Download counter
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

-- Profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage policies (bucket "indies" must exist first — create in Storage UI)
create policy "indies_auth_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'indies'
  and (storage.foldername(name))[1] in ('maps', 'covers')
);

create policy "indies_public_read"
on storage.objects for select
to public
using (bucket_id = 'indies');

create policy "indies_auth_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'indies'
  and auth.uid()::text = (storage.foldername(name))[2]
);

-- Score leaderboards (safe to re-run)
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.maps (id) on delete cascade,
  player_name text not null,
  difficulty text not null check (difficulty in ('easy', 'normal', 'hard', 'extreme')),
  score integer not null check (score >= 0 and score <= 99999999),
  accuracy numeric check (accuracy is null or (accuracy >= 0 and accuracy <= 1)),
  max_combo integer check (max_combo is null or max_combo >= 0),
  mod_version text,
  created_at timestamptz not null default now()
);

create index if not exists scores_leaderboard_idx
  on public.scores (map_id, difficulty, score desc, created_at desc);

alter table public.scores enable row level security;

drop policy if exists "scores_public_read" on public.scores;
create policy "scores_public_read" on public.scores for select using (true);

create or replace function public.submit_score(
  p_map_id uuid,
  p_player_name text,
  p_difficulty text,
  p_score integer,
  p_accuracy numeric default null,
  p_max_combo integer default null,
  p_mod_version text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  clean_name text;
begin
  if not exists (select 1 from public.maps where id = p_map_id) then
    raise exception 'Map not found';
  end if;
  clean_name := trim(substring(p_player_name from 1 for 32));
  if clean_name = '' then raise exception 'Player name required'; end if;
  if p_difficulty not in ('easy', 'normal', 'hard', 'extreme') then
    raise exception 'Invalid difficulty';
  end if;
  insert into public.scores (map_id, player_name, difficulty, score, accuracy, max_combo, mod_version)
  values (p_map_id, clean_name, p_difficulty, p_score, p_accuracy, p_max_combo, p_mod_version)
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.submit_score(uuid, text, text, integer, numeric, integer, text) to anon, authenticated;

create or replace function public.lookup_map_id(
  p_title text,
  p_artist text default '',
  p_charter text default ''
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.maps
  where lower(trim(title)) = lower(trim(p_title))
    and lower(trim(artist)) = lower(trim(coalesce(p_artist, '')))
    and (p_charter = '' or lower(trim(charter)) = lower(trim(p_charter)))
  order by created_at desc
  limit 1;
$$;

grant execute on function public.lookup_map_id(text, text, text) to anon, authenticated;
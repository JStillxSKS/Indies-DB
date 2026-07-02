-- Indies-DB score leaderboards (run in Supabase SQL Editor)

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

create index if not exists scores_map_idx on public.scores (map_id);

alter table public.scores enable row level security;

drop policy if exists "scores_public_read" on public.scores;
drop policy if exists "scores_insert_via_rpc" on public.scores;

create policy "scores_public_read" on public.scores for select using (true);

-- Inserts go through security-definer RPC (mod API), not direct client insert
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
  if clean_name = '' then
    raise exception 'Player name required';
  end if;

  if p_difficulty not in ('easy', 'normal', 'hard', 'extreme') then
    raise exception 'Invalid difficulty';
  end if;

  if p_score < 0 or p_score > 99999999 then
    raise exception 'Invalid score';
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
-- =============================================================================
-- INDIES-DB · ONE PASTE · SUPABASE SQL EDITOR
-- =============================================================================
-- HOW TO RUN:
--   1. Open Supabase dashboard for Indies-DB
--   2. Left sidebar → SQL Editor → New query
--   3. Ctrl+A this whole file → Ctrl+C → paste → Run
--
-- Safe to re-run. Sets up Classic + Arcade leaderboards end-to-end.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SCORES TABLE (create if missing; add arcade column if missing)
-- ---------------------------------------------------------------------------
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.maps (id) on delete cascade,
  player_name text not null,
  difficulty text not null,
  game_mode text not null default 'classic',
  score integer not null,
  accuracy numeric,
  max_combo integer,
  mod_version text,
  created_at timestamptz not null default now()
);

alter table public.scores
  add column if not exists game_mode text not null default 'classic';

alter table public.scores
  add column if not exists accuracy numeric;

alter table public.scores
  add column if not exists max_combo integer;

alter table public.scores
  add column if not exists mod_version text;

-- game_mode: classic | arcade only
alter table public.scores drop constraint if exists scores_game_mode_check;
alter table public.scores add constraint scores_game_mode_check
  check (game_mode in ('classic', 'arcade'));

-- difficulty values
alter table public.scores drop constraint if exists scores_difficulty_check;
alter table public.scores add constraint scores_difficulty_check
  check (difficulty in ('easy', 'normal', 'hard', 'extreme', 'hardcore'));

-- score range
alter table public.scores drop constraint if exists scores_score_check;
alter table public.scores add constraint scores_score_check
  check (score >= 0 and score <= 99999999);

-- accuracy optional 0..1
alter table public.scores drop constraint if exists scores_accuracy_check;
alter table public.scores add constraint scores_accuracy_check
  check (accuracy is null or (accuracy >= 0 and accuracy <= 1));

-- max_combo optional >= 0
alter table public.scores drop constraint if exists scores_max_combo_check;
alter table public.scores add constraint scores_max_combo_check
  check (max_combo is null or max_combo >= 0);

-- ---------------------------------------------------------------------------
-- INDEXES (unique = one best score per player/map/diff/MODE)
-- ---------------------------------------------------------------------------
drop index if exists scores_player_map_diff_idx;
drop index if exists scores_player_map_diff_mode_idx;
drop index if exists scores_leaderboard_idx;
drop index if exists scores_leaderboard_mode_idx;
drop index if exists scores_map_idx;

create unique index scores_player_map_diff_mode_idx
  on public.scores (map_id, lower(trim(player_name)), difficulty, game_mode);

create index scores_leaderboard_mode_idx
  on public.scores (map_id, game_mode, difficulty, score desc, created_at desc);

create index scores_map_idx on public.scores (map_id);

-- ---------------------------------------------------------------------------
-- RLS — public read; writes only via submit_score RPC
-- ---------------------------------------------------------------------------
alter table public.scores enable row level security;

drop policy if exists "scores_public_read" on public.scores;
drop policy if exists "scores_insert_via_rpc" on public.scores;

create policy "scores_public_read"
  on public.scores
  for select
  using (true);

-- ---------------------------------------------------------------------------
-- submit_score — FULL signature with p_game_mode (default classic)
-- ---------------------------------------------------------------------------
drop function if exists public.submit_score(uuid, text, text, integer, numeric, integer, text);
drop function if exists public.submit_score(uuid, text, text, integer, numeric, integer, text, text);

create or replace function public.submit_score(
  p_map_id uuid,
  p_player_name text,
  p_difficulty text,
  p_score integer,
  p_accuracy numeric default null,
  p_max_combo integer default null,
  p_mod_version text default null,
  p_game_mode text default 'classic'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  clean_name text;
  existing_id uuid;
  existing_score integer;
  mode text;
begin
  if not exists (select 1 from public.maps where id = p_map_id) then
    raise exception 'Map not found';
  end if;

  clean_name := trim(substring(p_player_name from 1 for 32));
  if clean_name = '' then
    raise exception 'Player name required';
  end if;

  mode := lower(trim(coalesce(p_game_mode, 'classic')));
  if mode not in ('classic', 'arcade') then
    raise exception 'Invalid game mode';
  end if;

  if p_difficulty not in ('easy', 'normal', 'hard', 'extreme', 'hardcore') then
    raise exception 'Invalid difficulty';
  end if;

  -- Smash Drums: Hardcore = Classic only. Arcade uses Extreme (not Hardcore).
  if p_difficulty = 'hardcore' and mode <> 'classic' then
    raise exception 'Hardcore is Classic only';
  end if;

  if p_score < 0 or p_score > 99999999 then
    raise exception 'Invalid score';
  end if;

  select id, score into existing_id, existing_score
  from public.scores
  where map_id = p_map_id
    and lower(trim(player_name)) = lower(clean_name)
    and difficulty = p_difficulty
    and game_mode = mode
  limit 1;

  if existing_id is not null then
    if p_score > existing_score then
      update public.scores
      set score = p_score,
          accuracy = p_accuracy,
          max_combo = p_max_combo,
          mod_version = p_mod_version,
          created_at = now()
      where id = existing_id;

      return jsonb_build_object(
        'id', existing_id,
        'improved', true,
        'score', p_score,
        'previous_score', existing_score,
        'game_mode', mode
      );
    end if;

    return jsonb_build_object(
      'id', existing_id,
      'improved', false,
      'score', existing_score,
      'submitted_score', p_score,
      'game_mode', mode
    );
  end if;

  insert into public.scores (
    map_id, player_name, difficulty, game_mode, score, accuracy, max_combo, mod_version
  )
  values (
    p_map_id, clean_name, p_difficulty, mode, p_score, p_accuracy, p_max_combo, p_mod_version
  )
  returning id into new_id;

  return jsonb_build_object(
    'id', new_id,
    'improved', true,
    'new', true,
    'score', p_score,
    'game_mode', mode
  );
end;
$$;

grant execute on function public.submit_score(
  uuid, text, text, integer, numeric, integer, text, text
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- lookup_map_id (used by submit-score API when only title/artist known)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- DIAGNOSTICS (results show after Run)
-- ---------------------------------------------------------------------------
select game_mode, difficulty, count(*)::int as n
from public.scores
group by 1, 2
order by 1, 2;

select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('submit_score', 'lookup_map_id')
order by 1, 2;

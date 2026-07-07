-- Add Hardcore as a leaderboard difficulty (run once in Supabase SQL Editor)

alter table public.scores drop constraint if exists scores_difficulty_check;

alter table public.scores add constraint scores_difficulty_check
  check (difficulty in ('easy', 'normal', 'hard', 'extreme', 'hardcore'));

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

  if p_difficulty not in ('easy', 'normal', 'hard', 'extreme', 'hardcore') then
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
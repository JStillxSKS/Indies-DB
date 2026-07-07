-- One score per player per map per difficulty; only keep/update if new score is higher.
-- Run once in Supabase SQL Editor (after hardcore.sql if you ran that).

-- Remove duplicate rows, keeping each player's best score per map/difficulty
delete from public.scores a
using public.scores b
where a.map_id = b.map_id
  and lower(trim(a.player_name)) = lower(trim(b.player_name))
  and a.difficulty = b.difficulty
  and (
    a.score < b.score
    or (a.score = b.score and a.created_at > b.created_at)
  );

create unique index if not exists scores_player_map_diff_idx
  on public.scores (map_id, lower(trim(player_name)), difficulty);

drop function if exists public.submit_score(uuid, text, text, integer, numeric, integer, text);

create or replace function public.submit_score(
  p_map_id uuid,
  p_player_name text,
  p_difficulty text,
  p_score integer,
  p_accuracy numeric default null,
  p_max_combo integer default null,
  p_mod_version text default null
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

  select id, score into existing_id, existing_score
  from public.scores
  where map_id = p_map_id
    and lower(trim(player_name)) = lower(clean_name)
    and difficulty = p_difficulty
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
        'previous_score', existing_score
      );
    end if;

    return jsonb_build_object(
      'id', existing_id,
      'improved', false,
      'score', existing_score,
      'submitted_score', p_score
    );
  end if;

  insert into public.scores (map_id, player_name, difficulty, score, accuracy, max_combo, mod_version)
  values (p_map_id, clean_name, p_difficulty, p_score, p_accuracy, p_max_combo, p_mod_version)
  returning id into new_id;

  return jsonb_build_object(
    'id', new_id,
    'improved', true,
    'new', true,
    'score', p_score
  );
end;
$$;

grant execute on function public.submit_score(uuid, text, text, integer, numeric, integer, text) to anon, authenticated;
-- Store Smash Drums in-game song IDs (e.g. "3CUhATcr" from Discord embeds)
-- so the Discord bot can resolve [Indies] hashes without a separate JSON file.
-- Run once in Supabase SQL Editor.

alter table public.maps
  add column if not exists in_game_hash text;

create unique index if not exists maps_in_game_hash_idx
  on public.maps (in_game_hash)
  where in_game_hash is not null;

-- Seed known mappings (safe to re-run — only fills rows that are still null)
update public.maps set in_game_hash = '3CUhATcr'
  where lower(trim(title)) = 'danger'
    and lower(trim(artist)) like '%shotty%'
    and in_game_hash is null;

update public.maps set in_game_hash = '3FqVcLYK'
  where lower(trim(title)) = 'rockstar'
    and lower(trim(artist)) like '%hardy%'
    and in_game_hash is null;

update public.maps set in_game_hash = 'BcdTd4hd'
  where lower(trim(title)) like '%enter sandman%'
    and lower(trim(artist)) like '%metallica%'
    and in_game_hash is null;

-- Called by Discord bot via /api/register-in-game-hash
create or replace function public.register_in_game_hash(
  p_hash text,
  p_title text,
  p_artist text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_map_id uuid;
  v_title text;
  v_artist text;
  v_hash text;
begin
  v_hash := trim(p_hash);
  if v_hash is null or length(v_hash) < 4 or length(v_hash) > 32 then
    raise exception 'invalid hash';
  end if;

  select id, title, artist
    into v_map_id, v_title, v_artist
  from public.maps
  where lower(trim(title)) = lower(trim(p_title))
    and lower(trim(artist)) = lower(trim(coalesce(p_artist, '')))
  order by created_at desc
  limit 1;

  if v_map_id is null then
    raise exception 'map not found on Indies-DB for title=% artist=%', p_title, p_artist;
  end if;

  if exists (
    select 1 from public.maps
    where in_game_hash = v_hash and id <> v_map_id
  ) then
    raise exception 'hash already assigned to another map';
  end if;

  update public.maps
  set in_game_hash = v_hash
  where id = v_map_id;

  return jsonb_build_object(
    'map_id', v_map_id,
    'title', v_title,
    'artist', v_artist,
    'in_game_hash', v_hash
  );
end;
$$;

grant execute on function public.register_in_game_hash(text, text, text) to anon, authenticated;
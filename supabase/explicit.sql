-- Explicit content flag for maps with swearing (safe to re-run).
-- Run in Supabase SQL Editor after schema.sql or on an existing project.

alter table public.maps
  add column if not exists explicit boolean not null default false;

-- Remove mistaken game-tag column if it was added earlier.
drop index if exists maps_tags_idx;
alter table public.maps drop column if exists tags;
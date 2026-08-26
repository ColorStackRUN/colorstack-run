-- Follow-up hardening for growth-ready CMS tables.
-- Keep trigger execution deterministic and support thumbnail foreign-key joins.

alter function public.set_growth_content_updated_at() set search_path = pg_catalog;

create index if not exists learning_resources_thumbnail_asset_id_idx
  on public.learning_resources (thumbnail_asset_id)
  where thumbnail_asset_id is not null;

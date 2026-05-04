-- Self-reported name for each change log row (who recorded the entry).

alter table public.admin_changelog
  add column if not exists author_name text not null default '';

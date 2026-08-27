-- Prevent a stale admin session from overwriting a newer site-content publish.

alter table public.site_content_store
  add column if not exists revision bigint not null default 1,
  add constraint site_content_store_revision_positive check (revision > 0);

create or replace function public.update_site_content_if_revision_matches(
  expected_revision bigint,
  next_content jsonb
)
returns table (revision bigint, updated_at timestamptz)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  return query
  update public.site_content_store
  set
    content_json = next_content,
    revision = site_content_store.revision + 1
  where id = 'primary'
    and site_content_store.revision = expected_revision
  returning site_content_store.revision, site_content_store.updated_at;
end;
$$;

revoke execute on function public.update_site_content_if_revision_matches(bigint, jsonb) from public;
revoke execute on function public.update_site_content_if_revision_matches(bigint, jsonb) from anon, authenticated;
grant execute on function public.update_site_content_if_revision_matches(bigint, jsonb) to service_role;

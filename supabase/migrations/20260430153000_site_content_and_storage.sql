-- Supabase migration: site content table + public media bucket
-- Apply this in Supabase SQL editor (or via CLI migration flow) before cutover.

create table if not exists public.site_content_store (
  id text primary key,
  content_json jsonb not null,
  updated_at timestamptz not null default now(),
  constraint site_content_store_primary_id check (id = 'primary')
);

alter table public.site_content_store enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_content_store'
      and policyname = 'service_role_full_access_site_content_store'
  ) then
    create policy service_role_full_access_site_content_store
      on public.site_content_store
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

create or replace function public.set_site_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_site_content_store_updated_at on public.site_content_store;
create trigger trg_site_content_store_updated_at
before update on public.site_content_store
for each row
execute function public.set_site_content_updated_at();

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = excluded.public;


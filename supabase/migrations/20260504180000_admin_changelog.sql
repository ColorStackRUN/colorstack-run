-- Admin-only change log (append-only). Service role writes via Next.js API.

create table if not exists public.admin_changelog (
  id uuid primary key default gen_random_uuid(),
  author_name text not null default '',
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_changelog_created_at_idx
  on public.admin_changelog (created_at desc);

alter table public.admin_changelog enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_changelog'
      and policyname = 'service_role_full_access_admin_changelog'
  ) then
    create policy service_role_full_access_admin_changelog
      on public.admin_changelog
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

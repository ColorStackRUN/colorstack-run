-- Google-authenticated admin authorization and attributable activity log entries.
-- Authorization is checked server-side after Supabase Auth verifies the session.

create table if not exists public.admin_access (
  email text primary key check (email = lower(btrim(email))),
  display_name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_access enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_access'
      and policyname = 'service_role_full_access_admin_access'
  ) then
    create policy service_role_full_access_admin_access
      on public.admin_access
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

insert into public.admin_access (email)
values
  ('jdc370@scarletmail.rutgers.edu'),
  ('efk40@scarletmail.rutgers.edu'),
  ('ap2616@scarletmail.rutgers.edu'),
  ('ech77@scarletmail.rutgers.edu'),
  ('jk2326@scarletmail.rutgers.edu'),
  ('oje6@scarletmail.rutgers.edu'),
  ('sk2524@scarletmail.rutgers.edu'),
  ('cp1133@scarletmail.rutgers.edu'),
  ('sls544@scarletmail.rutgers.edu'),
  ('mae173@scarletmail.rutgers.edu')
on conflict (email) do update
  set is_active = true,
      updated_at = now();

alter table public.admin_changelog
  add column if not exists author_email text,
  add column if not exists author_user_id uuid;

create index if not exists admin_changelog_author_user_id_created_at_idx
  on public.admin_changelog (author_user_id, created_at desc)
  where author_user_id is not null;

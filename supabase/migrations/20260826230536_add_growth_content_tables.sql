-- Growth-ready CMS persistence. Media bytes remain in Supabase Storage; this
-- migration stores only media metadata and normalizes collections that need
-- filtering, publish state, expiry, and stable public URLs.
--
-- This is additive and intentionally does not move the current JSONB document.
-- Application cutover/backfill should be a separate reviewed change.

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'site-media',
  storage_path text not null,
  public_url text not null,
  scope text not null check (scope in ('events', 'team', 'gallery', 'alumni', 'partners', 'learning')),
  content_type text not null,
  byte_size integer not null check (byte_size >= 0),
  alt_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_id, storage_path)
);

create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) > 0),
  series text not null default 'Whiteboard Warriors' check (length(trim(series)) > 0),
  summary text not null check (length(trim(summary)) > 0),
  description text not null check (length(trim(description)) > 0),
  speaker_name text not null check (length(trim(speaker_name)) > 0),
  speaker_title text,
  speaker_organization text,
  speaker_bio text,
  session_date date not null,
  duration_minutes integer check (duration_minutes > 0),
  level text not null default 'all-levels' check (level in ('beginner', 'intermediate', 'advanced', 'all-levels')),
  topics text[] not null default '{}',
  recording_url text not null check (recording_url ~ '^https://'),
  thumbnail_asset_id uuid references public.media_assets(id) on delete set null,
  slides_url text check (slides_url is null or slides_url ~ '^https://'),
  notes_url text check (notes_url is null or notes_url ~ '^https://'),
  code_url text check (code_url is null or code_url ~ '^https://'),
  transcript_url text check (transcript_url is null or transcript_url ~ '^https://'),
  featured boolean not null default false,
  published boolean not null default false,
  recording_consent_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_resources_publish_requires_consent
    check (not published or recording_consent_confirmed)
);

create table if not exists public.learning_resource_chapters (
  id uuid primary key default gen_random_uuid(),
  learning_resource_id uuid not null references public.learning_resources(id) on delete cascade,
  position smallint not null check (position >= 0),
  timestamp_label text not null check (length(trim(timestamp_label)) > 0),
  label text not null check (length(trim(label)) > 0),
  unique (learning_resource_id, position)
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null check (length(trim(title)) > 0),
  organization text not null check (length(trim(organization)) > 0),
  category text not null check (category in ('internship-job', 'scholarship', 'fellowship', 'hackathon', 'conference', 'research', 'mentorship', 'campus-leadership')),
  summary text not null check (length(trim(summary)) > 0),
  eligibility text,
  location text,
  work_mode text check (work_mode in ('remote', 'hybrid', 'in-person', 'not-applicable')),
  deadline date,
  compensation text,
  apply_url text not null check (apply_url ~ '^https://'),
  source_url text check (source_url is null or source_url ~ '^https://'),
  posted_at date not null,
  verified_at date,
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists learning_resources_public_listing_idx
  on public.learning_resources (featured desc, session_date desc)
  where published;
create index if not exists opportunities_public_listing_idx
  on public.opportunities (featured desc, deadline asc nulls last, posted_at desc)
  where published;
create index if not exists learning_resource_chapters_resource_position_idx
  on public.learning_resource_chapters (learning_resource_id, position);
create index if not exists media_assets_scope_created_at_idx
  on public.media_assets (scope, created_at desc);

create or replace function public.set_growth_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_media_assets_updated_at on public.media_assets;
create trigger trg_media_assets_updated_at before update on public.media_assets
for each row execute function public.set_growth_content_updated_at();
drop trigger if exists trg_learning_resources_updated_at on public.learning_resources;
create trigger trg_learning_resources_updated_at before update on public.learning_resources
for each row execute function public.set_growth_content_updated_at();
drop trigger if exists trg_opportunities_updated_at on public.opportunities;
create trigger trg_opportunities_updated_at before update on public.opportunities
for each row execute function public.set_growth_content_updated_at();

alter table public.media_assets enable row level security;
alter table public.learning_resources enable row level security;
alter table public.learning_resource_chapters enable row level security;
alter table public.opportunities enable row level security;

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array['media_assets', 'learning_resources', 'learning_resource_chapters', 'opportunities']
  loop
    policy_name := 'service_role_full_access_' || table_name;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = policy_name
    ) then
      execute format(
        'create policy %I on public.%I for all to service_role using (true) with check (true)',
        policy_name, table_name
      );
    end if;
  end loop;
end $$;

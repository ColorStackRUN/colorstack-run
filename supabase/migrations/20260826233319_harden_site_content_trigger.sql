-- Security hardening for the original site-content update trigger.

alter function public.set_site_content_updated_at() set search_path = pg_catalog;

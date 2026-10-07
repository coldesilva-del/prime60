-- First-party, cookieless page-view counts for the public pages. One row per
-- day, path and referring site. No visitor identifiers of any kind.
create table public.page_views (
  day date not null,
  path text not null,
  referrer_host text not null default '',
  views int not null default 0 check (views >= 0),
  primary key (day, path, referrer_host)
);
alter table public.page_views enable row level security;
alter table public.page_views force row level security;
revoke all on public.page_views from public, anon, authenticated;
-- Admins read it through the admin screen (service role); nobody else.
create policy page_views_select_admin on public.page_views
  for select to authenticated using ((select private.is_admin()));

create or replace function public.count_page_view(p_path text, p_referrer_host text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.page_views (day, path, referrer_host, views)
  values ((now() at time zone 'Australia/Brisbane')::date, left(p_path, 200), left(coalesce(p_referrer_host, ''), 200), 1)
  on conflict (day, path, referrer_host) do update set views = public.page_views.views + 1;
$$;
-- Only the server (service role) may call it.
revoke execute on function public.count_page_view(text, text) from public, anon, authenticated;

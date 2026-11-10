create table if not exists public.personal_daily_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_row integer not null,
  location_date date not null,
  country text not null,
  context text not null default '',
  created_at timestamptz not null default now(),
  constraint personal_daily_locations_unique_date unique (user_id, location_date),
  constraint personal_daily_locations_unique_source unique (user_id, source_row)
);

create index if not exists personal_daily_locations_owner_date_idx
  on public.personal_daily_locations (user_id, location_date desc);

alter table public.personal_daily_locations enable row level security;
revoke all on public.personal_daily_locations from anon, public;
grant select, insert on public.personal_daily_locations to authenticated;

drop policy if exists personal_daily_locations_select_own on public.personal_daily_locations;
create policy personal_daily_locations_select_own on public.personal_daily_locations
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists personal_daily_locations_insert_own on public.personal_daily_locations;
create policy personal_daily_locations_insert_own on public.personal_daily_locations
  for insert to authenticated with check ((select auth.uid()) = user_id);
create table if not exists public.personal_travel_flights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_row integer not null,
  flight_date date not null,
  flight_number text,
  origin_name text not null,
  origin_iata char(3),
  origin_icao char(4),
  destination_name text not null,
  destination_iata char(3),
  destination_icao char(4),
  departure_time text,
  arrival_time text,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  airline text,
  business_trip boolean,
  aircraft text,
  registration text,
  seat text,
  seat_type text,
  travel_class text,
  purpose text,
  note text,
  created_at timestamptz not null default now(),
  constraint personal_travel_flights_unique_source unique (user_id, source_row)
);

create table if not exists public.personal_country_stays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_row integer not null,
  start_date date not null,
  end_date date not null,
  country text not null,
  days_in_country integer not null check (days_in_country >= 0),
  created_at timestamptz not null default now(),
  constraint personal_country_stays_valid_dates check (end_date >= start_date),
  constraint personal_country_stays_unique_source unique (user_id, source_row)
);

create index if not exists personal_travel_flights_owner_date_idx
  on public.personal_travel_flights (user_id, flight_date desc);
create index if not exists personal_country_stays_owner_date_idx
  on public.personal_country_stays (user_id, start_date desc);

alter table public.personal_travel_flights enable row level security;
alter table public.personal_country_stays enable row level security;
revoke all on public.personal_travel_flights, public.personal_country_stays from anon, public;
grant select, insert, update, delete on public.personal_travel_flights, public.personal_country_stays to authenticated;

drop policy if exists personal_travel_flights_select_own on public.personal_travel_flights;
create policy personal_travel_flights_select_own on public.personal_travel_flights
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists personal_travel_flights_insert_own on public.personal_travel_flights;
create policy personal_travel_flights_insert_own on public.personal_travel_flights
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists personal_travel_flights_update_own on public.personal_travel_flights;
create policy personal_travel_flights_update_own on public.personal_travel_flights
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists personal_travel_flights_delete_own on public.personal_travel_flights;
create policy personal_travel_flights_delete_own on public.personal_travel_flights
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists personal_country_stays_select_own on public.personal_country_stays;
create policy personal_country_stays_select_own on public.personal_country_stays
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists personal_country_stays_insert_own on public.personal_country_stays;
create policy personal_country_stays_insert_own on public.personal_country_stays
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists personal_country_stays_update_own on public.personal_country_stays;
create policy personal_country_stays_update_own on public.personal_country_stays
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists personal_country_stays_delete_own on public.personal_country_stays;
create policy personal_country_stays_delete_own on public.personal_country_stays
  for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.personal_poland_analysis (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  analysis_start_date date not null,
  as_of_date date not null,
  forecast_end_date date not null,
  current_metrics jsonb not null,
  forecast_metrics jsonb not null,
  yearly_metrics jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.personal_poland_analysis enable row level security;
revoke all on public.personal_poland_analysis from anon, public;
grant select, insert, update, delete on public.personal_poland_analysis to authenticated;

drop policy if exists personal_poland_analysis_select_own on public.personal_poland_analysis;
create policy personal_poland_analysis_select_own on public.personal_poland_analysis
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists personal_poland_analysis_insert_own on public.personal_poland_analysis;
create policy personal_poland_analysis_insert_own on public.personal_poland_analysis
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists personal_poland_analysis_update_own on public.personal_poland_analysis;
create policy personal_poland_analysis_update_own on public.personal_poland_analysis
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists personal_poland_analysis_delete_own on public.personal_poland_analysis;
create policy personal_poland_analysis_delete_own on public.personal_poland_analysis
  for delete to authenticated using ((select auth.uid()) = user_id);

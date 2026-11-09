create table if not exists public.trip_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  reservation_type text not null check (reservation_type in ('hotel', 'flight')),
  sort_order integer not null default 0 check (sort_order >= 0),
  source_ref text not null,
  title text not null,
  city text,
  check_in date,
  check_out date,
  nights integer check (nights is null or nights >= 0),
  flight_number text,
  route text,
  flight_date date,
  departure_time text,
  arrival_time text,
  airline_name text,
  airline_logo text,
  provider text,
  booking_reference text,
  price_text text,
  total_price_text text,
  amount_local numeric(14, 2) check (amount_local is null or amount_local >= 0),
  currency_code char(3),
  amount_pln numeric(14, 2) check (amount_pln is null or amount_pln >= 0),
  pln_per_night numeric(18, 8) check (pln_per_night is null or pln_per_night >= 0),
  created_at timestamptz not null default now(),
  constraint trip_reservations_unique_source unique (trip_id, source_ref),
  constraint trip_reservations_valid_dates check (check_in is null or check_out is null or check_out >= check_in)
);

create index if not exists trip_reservations_owner_trip_order_idx
  on public.trip_reservations (user_id, trip_id, reservation_type, sort_order);

alter table public.trip_reservations enable row level security;
revoke all on public.trip_reservations from anon, public;
grant select, insert, update, delete on public.trip_reservations to authenticated;

drop policy if exists trip_reservations_select_own on public.trip_reservations;
create policy trip_reservations_select_own on public.trip_reservations for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid())));
drop policy if exists trip_reservations_insert_own on public.trip_reservations;
create policy trip_reservations_insert_own on public.trip_reservations for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid())));
drop policy if exists trip_reservations_update_own on public.trip_reservations;
create policy trip_reservations_update_own on public.trip_reservations for update to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid())));
drop policy if exists trip_reservations_delete_own on public.trip_reservations;
create policy trip_reservations_delete_own on public.trip_reservations for delete to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid())));

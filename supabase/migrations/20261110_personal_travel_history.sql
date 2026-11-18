-- PL: Przechowuj prywatne rekordy lotów z osobistej historii podróży. | ES-CO: Guarda vuelos privados del historial personal de viajes.
create table if not exists public.personal_travel_flights (
  -- PL: Nadaj rekordowi lotu unikalny identyfikator UUID. | ES-CO: Asigna un identificador UUID único al vuelo.
  id uuid primary key default gen_random_uuid(),
  -- PL: Powiąż lot z zalogowanym właścicielem. | ES-CO: Vincula el vuelo con su propietario autenticado.
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- PL: Zachowaj pierwotny numer wiersza historii do deduplikacji. | ES-CO: Conserva la fila original del historial para evitar duplicados.
  source_row integer not null,
  -- PL: Zapisz datę lotu. | ES-CO: Guarda la fecha del vuelo.
  flight_date date not null,
  -- PL: Zachowaj identyfikator lotu, jeśli jest dostępny. | ES-CO: Conserva el identificador del vuelo, si está disponible.
  flight_number text,
  -- PL: Nazwa oraz opcjonalne kody IATA i ICAO lotniska wylotu. | ES-CO: Nombre y códigos IATA e ICAO opcionales del aeropuerto de salida.
  origin_name text not null,
  origin_iata char(3),
  origin_icao char(4),
  -- PL: Nazwa oraz opcjonalne kody IATA i ICAO lotniska docelowego. | ES-CO: Nombre y códigos IATA e ICAO opcionales del aeropuerto de destino.
  destination_name text not null,
  destination_iata char(3),
  destination_icao char(4),
  -- PL: Zachowaj godziny odlotu i przylotu z historii. | ES-CO: Conserva las horas de salida y llegada del historial.
  departure_time text,
  arrival_time text,
  -- PL: Przechowuj nieujemny czas trwania lotu w minutach. | ES-CO: Guarda la duración del vuelo en minutos, sin valores negativos.
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  -- PL: Zachowaj przewoźnika i informację o podróży służbowej. | ES-CO: Conserva la aerolínea y si el viaje fue de trabajo.
  airline text,
  business_trip boolean,
  -- PL: Zachowaj szczegóły samolotu, miejsca i klasy podróży. | ES-CO: Conserva datos de aeronave, asiento y clase de viaje.
  aircraft text,
  registration text,
  seat text,
  seat_type text,
  travel_class text,
  -- PL: Zachowaj powód lotu i notatkę źródłową. | ES-CO: Conserva el motivo del vuelo y la nota de origen.
  purpose text,
  note text,
  -- PL: Automatycznie zapisuj czas dodania rekordu. | ES-CO: Registra automáticamente la fecha de creación.
  created_at timestamptz not null default now(),
  -- PL: Ogranicz import do jednego wpisu źródłowego na użytkownika. | ES-CO: Limita cada fila de origen a una importación por usuario.
  constraint personal_travel_flights_unique_source unique (user_id, source_row)
);

-- PL: Przechowuj prywatne przedziały pobytów w poszczególnych krajach. | ES-CO: Guarda periodos privados de estancia en cada país.
create table if not exists public.personal_country_stays (
  -- PL: Nadaj pobytowi unikalny identyfikator UUID. | ES-CO: Asigna un identificador UUID único a la estancia.
  id uuid primary key default gen_random_uuid(),
  -- PL: Powiąż pobyt z zalogowanym właścicielem. | ES-CO: Vincula la estancia con su propietario autenticado.
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- PL: Zachowaj numer źródłowego wiersza. | ES-CO: Conserva el número de la fila de origen.
  source_row integer not null,
  -- PL: Zapisz początek pobytu. | ES-CO: Guarda el comienzo de la estancia.
  start_date date not null,
  -- PL: Zapisz koniec pobytu. | ES-CO: Guarda el final de la estancia.
  end_date date not null,
  -- PL: Zachowaj nazwę kraju. | ES-CO: Conserva el nombre del país.
  country text not null,
  -- PL: Przechowuj nieujemną liczbę dni przypisanych do kraju. | ES-CO: Guarda un número no negativo de días atribuidos al país.
  days_in_country integer not null check (days_in_country >= 0),
  -- PL: Automatycznie zapisuj czas dodania rekordu. | ES-CO: Registra automáticamente la fecha de creación.
  created_at timestamptz not null default now(),
  -- PL: Wymagaj, by koniec pobytu nie poprzedzał początku. | ES-CO: Exige que el final de la estancia no sea anterior al inicio.
  constraint personal_country_stays_valid_dates check (end_date >= start_date),
  -- PL: Zapobiegaj ponownemu importowi tego samego wiersza dla użytkownika. | ES-CO: Evita volver a importar la misma fila para un usuario.
  constraint personal_country_stays_unique_source unique (user_id, source_row)
);

-- PL: Przyspiesz wyświetlanie lotów jednego użytkownika od najnowszej daty. | ES-CO: Acelera la consulta de vuelos por usuario desde la fecha más reciente.
create index if not exists personal_travel_flights_owner_date_idx
  on public.personal_travel_flights (user_id, flight_date desc);
-- PL: Przyspiesz wyświetlanie pobytów jednego użytkownika od najnowszego początku. | ES-CO: Acelera la consulta de estancias por usuario desde el inicio más reciente.
create index if not exists personal_country_stays_owner_date_idx
  on public.personal_country_stays (user_id, start_date desc);

-- PL: Włącz polityki bezpieczeństwa wierszy dla historii lotów i pobytów. | ES-CO: Activa políticas de seguridad por fila para vuelos y estancias.
alter table public.personal_travel_flights enable row level security;
alter table public.personal_country_stays enable row level security;
-- PL: Odbierz dostęp publiczny i anonimowy do obu tabel historii. | ES-CO: Revoca el acceso público y anónimo a ambas tablas del historial.
revoke all on public.personal_travel_flights, public.personal_country_stays from anon, public;
-- PL: Udostępnij operacje CRUD wyłącznie uwierzytelnionym rolom. | ES-CO: Concede operaciones CRUD únicamente a roles autenticados.
grant select, insert, update, delete on public.personal_travel_flights, public.personal_country_stays to authenticated;

-- PL: Usuń poprzednią politykę odczytu lotów. | ES-CO: Elimina la política previa de lectura de vuelos.
drop policy if exists personal_travel_flights_select_own on public.personal_travel_flights;
-- PL: Ogranicz odczyt lotów do ich właściciela. | ES-CO: Limita la lectura de vuelos a su propietario.
create policy personal_travel_flights_select_own on public.personal_travel_flights
  for select to authenticated using ((select auth.uid()) = user_id);
-- PL: Usuń poprzednią politykę dodawania lotów. | ES-CO: Elimina la política previa de inserción de vuelos.
drop policy if exists personal_travel_flights_insert_own on public.personal_travel_flights;
-- PL: Pozwól dodawać loty tylko na własne konto. | ES-CO: Permite insertar vuelos solo en la cuenta propia.
create policy personal_travel_flights_insert_own on public.personal_travel_flights
  for insert to authenticated with check ((select auth.uid()) = user_id);
-- PL: Usuń poprzednią politykę aktualizacji lotów. | ES-CO: Elimina la política previa de actualización de vuelos.
drop policy if exists personal_travel_flights_update_own on public.personal_travel_flights;
-- PL: Zezwól właścicielowi na aktualizację własnych lotów. | ES-CO: Permite al propietario actualizar sus propios vuelos.
create policy personal_travel_flights_update_own on public.personal_travel_flights
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- PL: Usuń poprzednią politykę usuwania lotów. | ES-CO: Elimina la política previa de eliminación de vuelos.
drop policy if exists personal_travel_flights_delete_own on public.personal_travel_flights;
-- PL: Zezwól właścicielowi usuwać własne loty. | ES-CO: Permite al propietario borrar sus propios vuelos.
create policy personal_travel_flights_delete_own on public.personal_travel_flights
  for delete to authenticated using ((select auth.uid()) = user_id);

-- PL: Usuń poprzednią politykę odczytu pobytów. | ES-CO: Elimina la política previa de lectura de estancias.
drop policy if exists personal_country_stays_select_own on public.personal_country_stays;
-- PL: Ogranicz odczyt pobytów do ich właściciela. | ES-CO: Limita la lectura de estancias a su propietario.
create policy personal_country_stays_select_own on public.personal_country_stays
  for select to authenticated using ((select auth.uid()) = user_id);
-- PL: Usuń poprzednią politykę dodawania pobytów. | ES-CO: Elimina la política previa de inserción de estancias.
drop policy if exists personal_country_stays_insert_own on public.personal_country_stays;
-- PL: Pozwól dodawać pobyty tylko na własne konto. | ES-CO: Permite insertar estancias solo en la cuenta propia.
create policy personal_country_stays_insert_own on public.personal_country_stays
  for insert to authenticated with check ((select auth.uid()) = user_id);
-- PL: Usuń poprzednią politykę aktualizacji pobytów. | ES-CO: Elimina la política previa de actualización de estancias.
drop policy if exists personal_country_stays_update_own on public.personal_country_stays;
-- PL: Zezwól właścicielowi aktualizować własne pobyty. | ES-CO: Permite al propietario actualizar sus propias estancias.
create policy personal_country_stays_update_own on public.personal_country_stays
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- PL: Usuń poprzednią politykę usuwania pobytów. | ES-CO: Elimina la política previa de eliminación de estancias.
drop policy if exists personal_country_stays_delete_own on public.personal_country_stays;
-- PL: Zezwól właścicielowi usuwać własne pobyty. | ES-CO: Permite al propietario borrar sus propias estancias.
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

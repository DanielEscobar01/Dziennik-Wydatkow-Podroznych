-- PL: Utwórz tabelę wydatków tylko wtedy, gdy jeszcze nie istnieje. | ES-CO: Crea la tabla de gastos solo si aún no existe.
-- PL: Przechowuj prywatne ustawienia każdego wyjazdu niezależnie od kodu aplikacji. | ES-CO: Guarda la configuración privada de cada viaje fuera del código.
create table if not exists public.trips (
  -- PL: Identyfikator wyjazdu. | ES-CO: Identificador del viaje.
  id uuid primary key default gen_random_uuid(),
  -- PL: Właściciel wyjazdu. | ES-CO: Propietario del viaje.
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- PL: Nazwa widoczna po zalogowaniu. | ES-CO: Nombre visible después de iniciar sesión.
  name text not null,
  -- PL: Początek zakresu dni podróży. | ES-CO: Inicio del rango de días del viaje.
  start_date date not null,
  -- PL: Koniec zakresu dni podróży. | ES-CO: Final del rango de días del viaje.
  end_date date not null,
  -- PL: Budżet dzienny zapisany dla tego wyjazdu. | ES-CO: Presupuesto diario de este viaje.
  daily_budget_pln numeric(14, 2) not null default 0 check (daily_budget_pln >= 0),
  -- PL: Dostępne saldo przed kosztami samego wyjazdu. | ES-CO: Saldo disponible antes de los gastos del viaje.
  available_before_trip_pln numeric(14, 2) not null default 0 check (available_before_trip_pln >= 0),
  -- PL: Źródło importu do aktualizacji tego samego wyjazdu bez duplikatów. | ES-CO: Referencia para actualizar el mismo viaje sin duplicarlo.
  source_ref text,
  -- PL: Czas utworzenia ustawień wyjazdu. | ES-CO: Fecha de creación de la configuración.
  created_at timestamptz not null default now(),
  -- PL: Wymagaj prawidłowej kolejności dat podróży. | ES-CO: Exige que las fechas del viaje estén en orden.
  constraint trips_valid_dates check (end_date >= start_date)
);

-- PL: Przechowuj plan miejsca i limit budżetu dla każdego dnia. | ES-CO: Guarda destino y presupuesto asignado a cada día.
create table if not exists public.trip_days (
  -- PL: Identyfikator dnia podróży. | ES-CO: Identificador del día del viaje.
  id uuid primary key default gen_random_uuid(),
  -- PL: Właściciel wiersza, zgodny z właścicielem wyjazdu. | ES-CO: Dueño de la fila, igual al dueño del viaje.
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- PL: Wyjazd, do którego należy dzień. | ES-CO: Viaje al que pertenece el día.
  trip_id uuid not null references public.trips(id) on delete cascade,
  -- PL: Data kalendarzowa dnia podróży. | ES-CO: Fecha calendario del día del viaje.
  trip_date date not null,
  -- PL: Nazwa miejsca zaplanowanego na ten dzień. | ES-CO: Destino planeado para ese día.
  destination text not null,
  -- PL: Nazwa kraju lub obszaru tego dnia. | ES-CO: País o región correspondiente al día.
  country text,
  -- PL: Opcjonalny budżet przypisany do dnia. | ES-CO: Presupuesto opcional asignado al día.
  daily_budget_pln numeric(14, 2) check (daily_budget_pln >= 0),
  -- PL: Nie pozwól dodać dwóch planów dla tego samego dnia wyjazdu. | ES-CO: Evita dos planes para la misma fecha de un viaje.
  constraint trip_days_unique_date unique (trip_id, trip_date)
);

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

-- PL: Utwórz tabelę wydatków tylko wtedy, gdy jeszcze nie istnieje. | ES-CO: Crea la tabla de gastos solo si aún no existe.
create table if not exists public.expenses (
  -- PL: Identyfikator każdego wydatku generowany po stronie bazy. | ES-CO: Identificador de cada gasto generado por la base de datos.
  id uuid primary key default gen_random_uuid(),
  -- PL: Właściciel wydatku; domyślnie bieżący użytkownik Supabase Auth. | ES-CO: Propietario del gasto; por defecto, el usuario autenticado actual.
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- PL: Powiąż wydatek z jednym prywatnym wyjazdem. | ES-CO: Vincula cada gasto con un viaje privado.
  trip_id uuid references public.trips(id) on delete cascade,
  -- PL: Dzień, w którym poniesiono wydatek. | ES-CO: Fecha en la que se hizo el gasto.
  expense_date date not null,
  -- PL: Kategoria używana do grupowania w dzienniku. | ES-CO: Categoría usada para agrupar en el diario.
  category text not null,
  -- PL: Krótki opis czytelny dla podróżującego. | ES-CO: Descripción corta para identificar el gasto.
  description text not null,
  -- PL: Kwota w oryginalnej walucie bez przeliczania. | ES-CO: Importe original en su moneda, sin convertir.
  amount_local numeric(14, 2) not null check (amount_local > 0),
  -- PL: Trzyliterowy kod waluty ISO 4217, na przykład JPY. | ES-CO: Código ISO 4217 de tres letras, por ejemplo JPY.
  currency_code char(3) not null,
  -- PL: Zapisany kurs PLN za jedną jednostkę waluty lokalnej. | ES-CO: Tasa guardada de PLN por una unidad de moneda local.
  pln_per_unit numeric(18, 8) not null check (pln_per_unit > 0),
  -- PL: Kwota w PLN utrwalona w chwili zapisu wydatku. | ES-CO: Equivalente en PLN fijado al guardar el gasto.
  amount_pln numeric(14, 2) not null check (amount_pln > 0),
  -- PL: Opcjonalny sposób płatności, na przykład karta lub gotówka. | ES-CO: Medio de pago opcional, por ejemplo tarjeta o efectivo.
  payment_method text,
  -- PL: Data kursu referencyjnego albo kursu wpisanego ręcznie. | ES-CO: Fecha de la tasa de referencia o de la tasa manual.
  rate_date date not null,
  -- PL: Oryginalny status z arkusza, na przykład Opłacone lub Płatne w Hotelu. | ES-CO: Estado original del Excel, como pagado o pendiente en hotel.
  expense_status text not null default 'W Podróży',
  -- PL: Stabilne źródło importu zapobiegające powtórzeniu tej samej pozycji. | ES-CO: Identificador de origen para evitar importar dos veces la misma fila.
  source_ref text,
  -- PL: Czas utworzenia rekordu w bazie. | ES-CO: Momento en que la base de datos creó el registro.
  created_at timestamptz not null default now()
);

-- PL: Wymuś kontrolę dostępu na poziomie każdego wiersza tabeli. | ES-CO: Activa el control de acceso a nivel de fila.
alter table public.trips enable row level security;
-- PL: Włącz RLS dla planu dni. | ES-CO: Activa RLS para los días del viaje.
alter table public.trip_days enable row level security;
alter table public.trip_reservations enable row level security;
-- PL: Wymuś kontrolę dostępu na poziomie każdego wiersza wydatków. | ES-CO: Activa el control de acceso a nivel de fila en gastos.
alter table public.expenses enable row level security;
-- PL: Odbierz domyślny dostęp anonimowy do konfiguracji wyjazdów. | ES-CO: Revoca acceso anónimo a la configuración del viaje.
revoke all on public.trips, public.trip_days, public.trip_reservations from anon, public;
-- PL: Jawnie odbierz dostęp anonimowy i odziedziczony dostęp publiczny. | ES-CO: Revoca explícitamente el acceso anónimo y público heredado.
revoke all on public.expenses from anon, public;
-- PL: Zezwól uwierzytelnionym rolom na korzystanie ze schematu public. | ES-CO: Permite que los usuarios autenticados usen el esquema public.
grant usage on schema public to authenticated;
-- PL: Nadaj dostęp do wyjazdów i dni tylko uwierzytelnionym rolom. | ES-CO: Concede acceso a viajes y días solo a roles autenticados.
grant select, insert, update, delete on public.trips, public.trip_days, public.trip_reservations to authenticated;
-- PL: Nadaj tylko potrzebne operacje tabeli; polityki RLS ograniczają wiersze. | ES-CO: Concede las operaciones necesarias; RLS limita las filas visibles.
grant select, insert, update, delete on public.expenses to authenticated;
-- PL: Przyspiesz wyświetlanie dziennika jednego użytkownika według daty. | ES-CO: Acelera la consulta del diario por usuario y fecha.
create index if not exists expenses_user_date_idx on public.expenses (user_id, expense_date);
-- PL: Przyspiesz wyświetlanie dziennika w obrębie wybranego wyjazdu. | ES-CO: Acelera la consulta del diario por viaje.
create index if not exists expenses_user_trip_date_idx on public.expenses (user_id, trip_id, expense_date);
-- PL: Gwarantuj jeden import wiersza Excela na użytkownika; NULL pozostaje dozwolony dla nowych wpisów. | ES-CO: Evita duplicar filas Excel por usuario y permite NULL en gastos nuevos.
create unique index if not exists expenses_user_source_ref_idx on public.expenses (user_id, source_ref);
-- PL: Aktualizuj importowany wyjazd bez tworzenia jego duplikatu. | ES-CO: Actualiza el viaje importado sin crear duplicados.
create unique index if not exists trips_user_source_ref_idx on public.trips (user_id, source_ref);

-- PL: Usuń i odtwórz polityki prywatnych wyjazdów. | ES-CO: Recrea las políticas de viajes privados.
drop policy if exists trips_select_own on public.trips;
-- PL: Odczytuj tylko własne wyjazdy. | ES-CO: Lee solo los viajes propios.
create policy trips_select_own on public.trips for select to authenticated using ((select auth.uid()) = user_id);
-- PL: Usuń poprzednią politykę tworzenia wyjazdów. | ES-CO: Quita la política anterior de inserción de viajes.
drop policy if exists trips_insert_own on public.trips;
-- PL: Twórz wyjazdy wyłącznie dla zalogowanego właściciela. | ES-CO: Crea viajes únicamente para el usuario autenticado.
create policy trips_insert_own on public.trips for insert to authenticated with check ((select auth.uid()) = user_id);
-- PL: Usuń poprzednią politykę aktualizacji wyjazdów. | ES-CO: Quita la política anterior de actualización de viajes.
drop policy if exists trips_update_own on public.trips;
-- PL: Aktualizuj tylko własne wyjazdy. | ES-CO: Actualiza únicamente viajes propios.
create policy trips_update_own on public.trips for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- PL: Usuń poprzednią politykę usuwania wyjazdów. | ES-CO: Quita la política anterior de borrado de viajes.
drop policy if exists trips_delete_own on public.trips;
-- PL: Usuń tylko własne wyjazdy. | ES-CO: Borra únicamente viajes propios.
create policy trips_delete_own on public.trips for delete to authenticated using ((select auth.uid()) = user_id);

-- PL: Usuń i odtwórz polityki planu dni. | ES-CO: Recrea las políticas de días del viaje.
drop policy if exists trip_days_select_own on public.trip_days;
-- PL: Odczytuj dni należące do własnego wyjazdu. | ES-CO: Lee días de viajes propios.
create policy trip_days_select_own on public.trip_days for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_days.trip_id and trips.user_id = (select auth.uid())));
-- PL: Usuń poprzednią politykę wstawiania dni. | ES-CO: Quita la política anterior de inserción de días.
drop policy if exists trip_days_insert_own on public.trip_days;
-- PL: Dodawaj dni tylko do własnego wyjazdu i własnego konta. | ES-CO: Agrega días solo al viaje y cuenta propios.
create policy trip_days_insert_own on public.trip_days for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_days.trip_id and trips.user_id = (select auth.uid())));
-- PL: Usuń poprzednią politykę aktualizacji dni. | ES-CO: Quita la política anterior de actualización de días.
drop policy if exists trip_days_update_own on public.trip_days;
-- PL: Aktualizuj dni wyłącznie we własnym wyjeździe. | ES-CO: Actualiza días únicamente en viajes propios.
create policy trip_days_update_own on public.trip_days for update to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_days.trip_id and trips.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_days.trip_id and trips.user_id = (select auth.uid())));
-- PL: Usuń poprzednią politykę usuwania dni. | ES-CO: Quita la política anterior de borrado de días.
drop policy if exists trip_days_delete_own on public.trip_days;
-- PL: Usuwaj dni tylko z własnego wyjazdu. | ES-CO: Borra días únicamente de viajes propios.
create policy trip_days_delete_own on public.trip_days for delete to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_days.trip_id and trips.user_id = (select auth.uid())));

drop policy if exists trip_reservations_select_own on public.trip_reservations;
create policy trip_reservations_select_own on public.trip_reservations for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid())));
drop policy if exists trip_reservations_insert_own on public.trip_reservations;
create policy trip_reservations_insert_own on public.trip_reservations for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid())));
drop policy if exists trip_reservations_update_own on public.trip_reservations;
create policy trip_reservations_update_own on public.trip_reservations for update to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid())));
drop policy if exists trip_reservations_delete_own on public.trip_reservations;
create policy trip_reservations_delete_own on public.trip_reservations for delete to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid())));

-- PL: Usuń poprzednią politykę odczytu, aby skrypt można było uruchomić ponownie. | ES-CO: Borra la política de lectura previa para permitir repetir el script.
drop policy if exists expenses_select_own on public.expenses;
-- PL: Pozwól czytać wyłącznie rekordy należące do zalogowanego użytkownika. | ES-CO: Permite leer únicamente registros del usuario autenticado.
create policy expenses_select_own on public.expenses for select to authenticated using ((select auth.uid()) = user_id and (trip_id is null or exists (select 1 from public.trips where trips.id = expenses.trip_id and trips.user_id = (select auth.uid()))));
-- PL: Usuń poprzednią politykę dodawania przed jej odtworzeniem. | ES-CO: Borra la política previa de inserción antes de recrearla.
drop policy if exists expenses_insert_own on public.expenses;
-- PL: Wymagaj, aby nowy rekord należał do zalogowanego użytkownika. | ES-CO: Exige que el nuevo registro pertenezca al usuario autenticado.
create policy expenses_insert_own on public.expenses for insert to authenticated with check ((select auth.uid()) = user_id and trip_id is not null and exists (select 1 from public.trips where trips.id = expenses.trip_id and trips.user_id = (select auth.uid())));
-- PL: Usuń poprzednią politykę aktualizacji przed jej odtworzeniem. | ES-CO: Borra la política previa de actualización antes de recrearla.
drop policy if exists expenses_update_own on public.expenses;
-- PL: Ogranicz aktualizację zarówno starego, jak i nowego właściciela rekordu. | ES-CO: Limita la actualización al dueño actual y al nuevo dueño del registro.
create policy expenses_update_own on public.expenses for update to authenticated using ((select auth.uid()) = user_id and (trip_id is null or exists (select 1 from public.trips where trips.id = expenses.trip_id and trips.user_id = (select auth.uid())))) with check ((select auth.uid()) = user_id and trip_id is not null and exists (select 1 from public.trips where trips.id = expenses.trip_id and trips.user_id = (select auth.uid())));
-- PL: Usuń poprzednią politykę usuwania przed jej odtworzeniem. | ES-CO: Borra la política previa de eliminación antes de recrearla.
drop policy if exists expenses_delete_own on public.expenses;
-- PL: Pozwól usuwać tylko własne rekordy wydatków. | ES-CO: Permite borrar únicamente los gastos propios.
create policy expenses_delete_own on public.expenses for delete to authenticated using ((select auth.uid()) = user_id);

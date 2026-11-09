-- PL: Dodaj tabelę prywatnych wyjazdów dla istniejącego projektu. | ES-CO: Agrega la tabla de viajes privados al proyecto existente.
create table if not exists public.trips (
  -- PL: Identyfikator wyjazdu generowany przez bazę. | ES-CO: Identificador del viaje generado por la base.
  id uuid primary key default gen_random_uuid(),
  -- PL: Właściciel wyjazdu powiązany z Supabase Auth. | ES-CO: Propietario del viaje asociado con Supabase Auth.
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- PL: Nazwa widoczna po zalogowaniu. | ES-CO: Nombre visible después de iniciar sesión.
  name text not null,
  -- PL: Pierwszy dzień podróży. | ES-CO: Primer día del viaje.
  start_date date not null,
  -- PL: Ostatni dzień podróży. | ES-CO: Último día del viaje.
  end_date date not null,
  -- PL: Budżet dzienny zapisany prywatnie dla wyjazdu. | ES-CO: Presupuesto diario privado del viaje.
  daily_budget_pln numeric(14, 2) not null default 0 check (daily_budget_pln >= 0),
  -- PL: Dostępne saldo przed faktycznymi wydatkami podróży. | ES-CO: Saldo disponible antes de los gastos reales del viaje.
  available_before_trip_pln numeric(14, 2) not null default 0 check (available_before_trip_pln >= 0),
  -- PL: Stabilne źródło importu do aktualizacji bez duplikatów. | ES-CO: Referencia estable de importación para actualizar sin duplicar.
  source_ref text,
  -- PL: Czas utworzenia wyjazdu. | ES-CO: Fecha de creación del viaje.
  created_at timestamptz not null default now(),
  -- PL: Wymagaj prawidłowej kolejności dat. | ES-CO: Exige un rango de fechas válido.
  constraint trips_valid_dates check (end_date >= start_date)
);

-- PL: Dodaj plan miejsc i budżet dla każdego dnia konkretnego wyjazdu. | ES-CO: Agrega destino y presupuesto para cada día del viaje.
create table if not exists public.trip_days (
  -- PL: Identyfikator dnia podróży. | ES-CO: Identificador del día del viaje.
  id uuid primary key default gen_random_uuid(),
  -- PL: Właściciel wiersza planu. | ES-CO: Propietario de la fila del itinerario.
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- PL: Wyjazd zawierający ten dzień. | ES-CO: Viaje al que pertenece este día.
  trip_id uuid not null references public.trips(id) on delete cascade,
  -- PL: Data kalendarzowa tego dnia. | ES-CO: Fecha calendario de este día.
  trip_date date not null,
  -- PL: Miejsce zaplanowane na ten dzień. | ES-CO: Destino planeado para el día.
  destination text not null,
  -- PL: Kraj lub obszar dnia. | ES-CO: País o región del día.
  country text,
  -- PL: Opcjonalny budżet dzienny z arkusza. | ES-CO: Presupuesto diario opcional del Excel.
  daily_budget_pln numeric(14, 2) check (daily_budget_pln >= 0),
  -- PL: Nie pozwól dodać dwóch planów dla tego samego dnia podróży. | ES-CO: Evita duplicar el mismo día del viaje.
  constraint trip_days_unique_date unique (trip_id, trip_date)
);

-- PL: Dodaj powiązanie do wyjazdu; istniejące wydatki pozostają tymczasowo bez przypisania. | ES-CO: Agrega la relación del viaje; gastos existentes quedan sin asignar temporalmente.
alter table public.expenses
  add column if not exists trip_id uuid references public.trips(id) on delete cascade;

-- PL: Indeksuj dziennik według właściciela, wyjazdu i daty. | ES-CO: Indexa el diario por dueño, viaje y fecha.
create index if not exists expenses_user_trip_date_idx
  on public.expenses (user_id, trip_id, expense_date);

-- PL: Ogranicz do jednego rekordu importu wyjazdu na konto i źródło. | ES-CO: Limita a un registro de importación por viaje y cuenta.
create unique index if not exists trips_user_source_ref_idx
  on public.trips (user_id, source_ref);

-- PL: Włącz RLS dla prywatnych ustawień wyjazdu. | ES-CO: Activa RLS para la configuración privada del viaje.
alter table public.trips enable row level security;
-- PL: Włącz RLS dla prywatnego planu dni. | ES-CO: Activa RLS para el itinerario privado.
alter table public.trip_days enable row level security;

-- PL: Odbierz domyślny dostęp publiczny i anonimowy do tabel podróży. | ES-CO: Revoca acceso público y anónimo a las tablas de viajes.
revoke all on public.trips, public.trip_days from anon, public;
-- PL: Nadaj potrzebne operacje wyłącznie roli authenticated. | ES-CO: Concede las operaciones necesarias solo a authenticated.
grant select, insert, update, delete on public.trips, public.trip_days to authenticated;

-- PL: Odtwórz polityki podróży, ograniczając je do bieżącego właściciela. | ES-CO: Recrea políticas de viajes limitadas al usuario actual.
drop policy if exists trips_select_own on public.trips;
-- PL: Odczytuj wyłącznie własne wyjazdy. | ES-CO: Permite leer únicamente viajes propios.
create policy trips_select_own on public.trips for select to authenticated using ((select auth.uid()) = user_id);
-- PL: Odtwórz politykę tworzenia prywatnych wyjazdów. | ES-CO: Recrea la política de inserción de viajes privados.
drop policy if exists trips_insert_own on public.trips;
-- PL: Twórz wyjazdy tylko dla zalogowanego właściciela. | ES-CO: Permite crear viajes solo para el usuario autenticado.
create policy trips_insert_own on public.trips for insert to authenticated with check ((select auth.uid()) = user_id);
-- PL: Odtwórz politykę aktualizacji własnych wyjazdów. | ES-CO: Recrea la política de actualización de viajes propios.
drop policy if exists trips_update_own on public.trips;
-- PL: Aktualizuj rekordy wyłącznie właściciela. | ES-CO: Permite actualizar únicamente registros propios.
create policy trips_update_own on public.trips for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- PL: Odtwórz politykę usuwania własnych wyjazdów. | ES-CO: Recrea la política de borrado de viajes propios.
drop policy if exists trips_delete_own on public.trips;
-- PL: Usuwaj wyłącznie własne wyjazdy. | ES-CO: Permite borrar únicamente viajes propios.
create policy trips_delete_own on public.trips for delete to authenticated using ((select auth.uid()) = user_id);

-- PL: Odtwórz polityki planu dnia z kontrolą właściciela wyjazdu. | ES-CO: Recrea políticas del itinerario verificando al dueño del viaje.
drop policy if exists trip_days_select_own on public.trip_days;
-- PL: Odczytuj dni tylko z wyjazdów bieżącego użytkownika. | ES-CO: Lee días solo de viajes del usuario actual.
create policy trip_days_select_own on public.trip_days for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_days.trip_id and trips.user_id = (select auth.uid())));
-- PL: Odtwórz politykę dodawania dni. | ES-CO: Recrea la política para agregar días.
drop policy if exists trip_days_insert_own on public.trip_days;
-- PL: Dodawaj dni wyłącznie do własnego wyjazdu. | ES-CO: Agrega días únicamente a viajes propios.
create policy trip_days_insert_own on public.trip_days for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_days.trip_id and trips.user_id = (select auth.uid())));
-- PL: Odtwórz politykę edycji dni. | ES-CO: Recrea la política de edición de días.
drop policy if exists trip_days_update_own on public.trip_days;
-- PL: Aktualizuj dni wyłącznie w wyjazdach właściciela. | ES-CO: Actualiza días solo en viajes propios.
create policy trip_days_update_own on public.trip_days for update to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_days.trip_id and trips.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_days.trip_id and trips.user_id = (select auth.uid())));
-- PL: Odtwórz politykę usuwania dni. | ES-CO: Recrea la política de eliminación de días.
drop policy if exists trip_days_delete_own on public.trip_days;
-- PL: Usuwaj dni wyłącznie z wyjazdów właściciela. | ES-CO: Borra días únicamente de viajes propios.
create policy trip_days_delete_own on public.trip_days for delete to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_days.trip_id and trips.user_id = (select auth.uid())));

-- PL: Odtwórz polityki wydatków z kontrolą, czy trip_id należy do użytkownika. | ES-CO: Recrea políticas de gastos verificando que trip_id pertenezca al usuario.
drop policy if exists expenses_select_own on public.expenses;
-- PL: Czytaj własne wydatki, w tym stare rekordy bez przypisania do wyjazdu. | ES-CO: Lee gastos propios, incluso registros antiguos aún sin viaje.
create policy expenses_select_own on public.expenses for select to authenticated using ((select auth.uid()) = user_id and (trip_id is null or exists (select 1 from public.trips where trips.id = expenses.trip_id and trips.user_id = (select auth.uid()))));
-- PL: Odtwórz politykę dodawania wydatków do wyjazdu. | ES-CO: Recrea la política de gastos asociados a un viaje.
drop policy if exists expenses_insert_own on public.expenses;
-- PL: Dodawaj wydatki tylko do wyjazdu należącego do użytkownika. | ES-CO: Inserta gastos solo en viajes del usuario autenticado.
create policy expenses_insert_own on public.expenses for insert to authenticated with check ((select auth.uid()) = user_id and trip_id is not null and exists (select 1 from public.trips where trips.id = expenses.trip_id and trips.user_id = (select auth.uid())));
-- PL: Odtwórz politykę aktualizacji wydatków. | ES-CO: Recrea la política de actualización de gastos.
drop policy if exists expenses_update_own on public.expenses;
-- PL: Aktualizuj własne wydatki i przypisuj je wyłącznie do własnych wyjazdów. | ES-CO: Actualiza gastos propios y asígnalos solo a viajes propios.
create policy expenses_update_own on public.expenses for update to authenticated using ((select auth.uid()) = user_id and (trip_id is null or exists (select 1 from public.trips where trips.id = expenses.trip_id and trips.user_id = (select auth.uid())))) with check ((select auth.uid()) = user_id and trip_id is not null and exists (select 1 from public.trips where trips.id = expenses.trip_id and trips.user_id = (select auth.uid())));

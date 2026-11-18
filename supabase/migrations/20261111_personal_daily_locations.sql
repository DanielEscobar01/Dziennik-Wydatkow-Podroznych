-- PL: Przechowuj prywatne wpisy dziennej lokalizacji użytkownika. | ES-CO: Guarda ubicaciones diarias privadas de cada usuario.
create table if not exists public.personal_daily_locations (
  -- PL: Nadaj wpisowi unikalny identyfikator UUID. | ES-CO: Asigna un identificador UUID único al registro.
  id uuid primary key default gen_random_uuid(),
  -- PL: Powiąż wpis z zalogowanym właścicielem. | ES-CO: Vincula el registro con su propietario autenticado.
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- PL: Zachowaj numer wiersza źródłowego do identyfikacji importu. | ES-CO: Conserva el número de fila de origen para identificar la importación.
  source_row integer not null,
  -- PL: Zapisz dzień, którego dotyczy lokalizacja. | ES-CO: Guarda la fecha a la que corresponde la ubicación.
  location_date date not null,
  -- PL: Zapisz kraj lokalizacji. | ES-CO: Guarda el país de la ubicación.
  country text not null,
  -- PL: Zachowaj dodatkowy kontekst miejsca; domyślnie pusty. | ES-CO: Conserva el contexto adicional del lugar; vacío de forma predeterminada.
  context text not null default '',
  -- PL: Automatycznie zapisz czas utworzenia wpisu. | ES-CO: Registra automáticamente la fecha de creación del registro.
  created_at timestamptz not null default now(),
  -- PL: Dopuszczaj tylko jeden wpis na użytkownika i dzień. | ES-CO: Permite un solo registro por usuario y fecha.
  constraint personal_daily_locations_unique_date unique (user_id, location_date),
  -- PL: Nie pozwól zaimportować tego samego wiersza źródłowego dwa razy. | ES-CO: Evita importar dos veces la misma fila de origen.
  constraint personal_daily_locations_unique_source unique (user_id, source_row)
);

-- PL: Przyspiesz wyświetlanie historii jednego użytkownika od najnowszego dnia. | ES-CO: Acelera el historial de un usuario desde la fecha más reciente.
create index if not exists personal_daily_locations_owner_date_idx
  on public.personal_daily_locations (user_id, location_date desc);

-- PL: Włącz filtrowanie dostępu na poziomie wierszy. | ES-CO: Activa el filtrado de acceso a nivel de fila.
alter table public.personal_daily_locations enable row level security;
-- PL: Odbierz dostęp do tabeli rolom anonimowym i publicznym. | ES-CO: Revoca el acceso a los roles anónimos y públicos.
revoke all on public.personal_daily_locations from anon, public;
-- PL: Przyznaj zalogowanym kontom tylko odczyt i dodawanie wpisów. | ES-CO: Concede a las cuentas autenticadas solo lectura e inserción.
grant select, insert on public.personal_daily_locations to authenticated;

-- PL: Usuń poprzednią politykę odczytu przed ponownym utworzeniem. | ES-CO: Elimina la política previa de lectura antes de recrearla.
drop policy if exists personal_daily_locations_select_own on public.personal_daily_locations;
-- PL: Ogranicz odczyt do wpisów bieżącego użytkownika. | ES-CO: Limita la lectura a los registros del usuario actual.
create policy personal_daily_locations_select_own on public.personal_daily_locations
  for select to authenticated using ((select auth.uid()) = user_id);
-- PL: Usuń poprzednią politykę dodawania wpisów. | ES-CO: Elimina la política previa de inserción.
drop policy if exists personal_daily_locations_insert_own on public.personal_daily_locations;
-- PL: Pozwól dodawać wpis tylko dla konta bieżącego użytkownika. | ES-CO: Permite insertar registros solo para la cuenta del usuario actual.
create policy personal_daily_locations_insert_own on public.personal_daily_locations
  for insert to authenticated with check ((select auth.uid()) = user_id);
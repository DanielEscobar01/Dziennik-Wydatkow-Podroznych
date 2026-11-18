-- PL: Rejestruj jawnie powiązane pary kont, które mogą współdzielić dane. | ES-CO: Registra pares de cuentas vinculadas explícitamente que pueden compartir datos.
create table if not exists public.account_links (
  -- PL: Zapisz pierwszy identyfikator właściciela w parze. | ES-CO: Guarda el primer identificador de propietario del par.
  user_a uuid not null references auth.users(id) on delete cascade,
  -- PL: Zapisz drugi identyfikator właściciela w parze. | ES-CO: Guarda el segundo identificador de propietario del par.
  user_b uuid not null references auth.users(id) on delete cascade,
  -- PL: Ustaw czas utworzenia powiązania. | ES-CO: Registra la fecha de creación del vínculo.
  created_at timestamptz not null default now(),
  -- PL: Zapewnij unikalność pary kont. | ES-CO: Garantiza que cada par de cuentas sea único.
  primary key (user_a, user_b),
  -- PL: Zabroń tworzenia powiązania użytkownika z samym sobą. | ES-CO: Impide vincular una cuenta consigo misma.
  constraint account_links_distinct_users check (user_a <> user_b),
  -- PL: Wymuś kanoniczną kolejność identyfikatorów w parze. | ES-CO: Exige un orden canónico de identificadores en el par.
  constraint account_links_canonical_order check (user_a < user_b)
);

-- PL: Włącz filtrowanie wierszy w tabeli powiązań kont. | ES-CO: Activa el filtrado por fila en la tabla de vínculos.
alter table public.account_links enable row level security;
-- PL: Odbierz ogólny dostęp do powiązań kont. | ES-CO: Revoca el acceso general a los vínculos de cuentas.
revoke all on public.account_links from anon, public;
-- PL: Zezwól zalogowanym kontom na odczyt, kontrolowany przez RLS. | ES-CO: Permite leer a cuentas autenticadas, sujeto a RLS.
grant select on public.account_links to authenticated;

-- PL: Usuń poprzednią politykę odczytu powiązań. | ES-CO: Elimina la política previa de lectura de vínculos.
drop policy if exists account_links_select_pair on public.account_links;
-- PL: Pozwól każdej stronie pary odczytać istniejące powiązanie. | ES-CO: Permite a cualquiera de las dos cuentas leer el vínculo.
create policy account_links_select_pair on public.account_links
  for select to authenticated using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

-- PL: Sprawdź, czy bieżący użytkownik ma dostęp do wskazanego konta. | ES-CO: Comprueba si el usuario actual puede acceder a la cuenta indicada.
create or replace function public.can_access_account(target_user_id uuid)
-- PL: Zwróć logiczny wynik kontroli dostępu. | ES-CO: Devuelve el resultado booleano de la comprobación de acceso.
returns boolean
-- PL: Wykonaj funkcję jako zapytanie SQL bez modyfikacji danych. | ES-CO: Ejecuta la función como una consulta SQL sin modificar datos.
language sql
-- PL: Oznacz odczytową funkcję jako stabilną w trakcie pojedynczego zapytania. | ES-CO: Marca la función de lectura como estable durante una consulta.
stable
-- PL: Użyj uprawnień właściciela funkcji dla sprawdzenia powiązań. | ES-CO: Usa los permisos del propietario de la función para consultar vínculos.
security definer
-- PL: Ogranicz ścieżkę wyszukiwania schematów do pustej wartości. | ES-CO: Restringe a vacío la ruta de búsqueda de esquemas.
set search_path = ''
as $$
  -- PL: Zezwól na dostęp do własnego konta lub konta powiązanego. | ES-CO: Permite acceder a la cuenta propia o a una cuenta vinculada.
  select target_user_id = (select auth.uid()) or exists (
    -- PL: Poszukaj pary, w której oba identyfikatory należą do użytkownika i celu. | ES-CO: Busca un par cuyos identificadores correspondan al usuario y a la cuenta objetivo.
    select 1
    -- PL: Odczytaj pary z tabeli powiązań. | ES-CO: Consulta los pares de la tabla de vínculos.
    from public.account_links as links
    -- PL: Sprawdź oba możliwe ustawienia kolejności identyfikatorów. | ES-CO: Comprueba ambas posiciones posibles de los identificadores.
    where (links.user_a = target_user_id and links.user_b = (select auth.uid()))
       or (links.user_b = target_user_id and links.user_a = (select auth.uid()))
  );
$$;

-- PL: Odbierz publiczny dostęp do funkcji sprawdzającej uprawnienia. | ES-CO: Revoca el acceso público a la función que comprueba permisos.
revoke all on function public.can_access_account(uuid) from public, anon;
-- PL: Udostępnij sprawdzanie dostępu tylko uwierzytelnionym użytkownikom. | ES-CO: Permite comprobar el acceso solo a usuarios autenticados.
grant execute on function public.can_access_account(uuid) to authenticated;

-- PL: Zastąp politykę odczytu podróży warunkiem powiązanego konta. | ES-CO: Sustituye la política de lectura de viajes por una comprobación de cuenta vinculada.
drop policy if exists trips_select_own on public.trips;
drop policy if exists trips_select_shared on public.trips;
create policy trips_select_shared on public.trips
  for select to authenticated using (public.can_access_account(user_id));

drop policy if exists trips_insert_own on public.trips;
drop policy if exists trips_insert_self on public.trips;
create policy trips_insert_self on public.trips
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- PL: Zastąp ograniczenie aktualizacji, dopuszczając współdzielone podróże. | ES-CO: Sustituye la restricción de actualización para permitir viajes compartidos.
drop policy if exists trips_update_own on public.trips;
drop policy if exists trips_update_shared on public.trips;
create policy trips_update_shared on public.trips
  for update to authenticated using (public.can_access_account(user_id))
  with check (public.can_access_account(user_id));

-- PL: Zastąp ograniczenie usuwania dla właściciela lub powiązanego konta. | ES-CO: Sustituye la restricción de borrado para el propietario o una cuenta vinculada.
drop policy if exists trips_delete_own on public.trips;
drop policy if exists trips_delete_shared on public.trips;
create policy trips_delete_shared on public.trips
  for delete to authenticated using (public.can_access_account(user_id));

-- PL: Stosuj kontrolę powiązania do odczytu dni wyjazdu. | ES-CO: Aplica la comprobación de vínculo al leer días del viaje.
drop policy if exists trip_days_select_own on public.trip_days;
drop policy if exists trip_days_select_shared on public.trip_days;
create policy trip_days_select_shared on public.trip_days
  for select to authenticated using (
    public.can_access_account(user_id)
    and exists (
      select 1 from public.trips
      where trips.id = trip_days.trip_id and public.can_access_account(trips.user_id)
    )
  );

-- PL: Pozwól właścicielowi dodawać dni wyłącznie do podróży z dostępem. | ES-CO: Permite al propietario agregar días solo a viajes accesibles.
drop policy if exists trip_days_insert_own on public.trip_days;
drop policy if exists trip_days_insert_shared on public.trip_days;
create policy trip_days_insert_shared on public.trip_days
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.trips
      where trips.id = trip_days.trip_id and public.can_access_account(trips.user_id)
    )
  );

-- PL: Sprawdzaj dostęp do podróży przy aktualizacji dni. | ES-CO: Comprueba el acceso al viaje al actualizar sus días.
drop policy if exists trip_days_update_own on public.trip_days;
drop policy if exists trip_days_update_shared on public.trip_days;
create policy trip_days_update_shared on public.trip_days
  for update to authenticated using (
    public.can_access_account(user_id)
    and exists (
      select 1 from public.trips
      where trips.id = trip_days.trip_id and public.can_access_account(trips.user_id)
    )
  ) with check (
    public.can_access_account(user_id)
    and exists (
      select 1 from public.trips
      where trips.id = trip_days.trip_id and public.can_access_account(trips.user_id)
    )
  );

-- PL: Ogranicz usuwanie dni do podróży dostępnych dla konta. | ES-CO: Limita el borrado de días a viajes accesibles para la cuenta.
drop policy if exists trip_days_delete_own on public.trip_days;
drop policy if exists trip_days_delete_shared on public.trip_days;
create policy trip_days_delete_shared on public.trip_days
  for delete to authenticated using (
    public.can_access_account(user_id)
    and exists (
      select 1 from public.trips
      where trips.id = trip_days.trip_id and public.can_access_account(trips.user_id)
    )
  );

-- PL: Udostępnij odczyt rezerwacji z podróży powiązanego konta. | ES-CO: Permite leer reservas de viajes de una cuenta vinculada.
drop policy if exists trip_reservations_select_own on public.trip_reservations;
drop policy if exists trip_reservations_select_shared on public.trip_reservations;
create policy trip_reservations_select_shared on public.trip_reservations
  for select to authenticated using (
    public.can_access_account(user_id)
    and exists (
      select 1 from public.trips
      where trips.id = trip_reservations.trip_id and public.can_access_account(trips.user_id)
    )
  );

-- PL: Pozwól właścicielowi zapisywać rezerwacje do dostępnej podróży. | ES-CO: Permite al propietario guardar reservas en un viaje accesible.
drop policy if exists trip_reservations_insert_own on public.trip_reservations;
drop policy if exists trip_reservations_insert_shared on public.trip_reservations;
create policy trip_reservations_insert_shared on public.trip_reservations
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.trips
      where trips.id = trip_reservations.trip_id and public.can_access_account(trips.user_id)
    )
  );

-- PL: Sprawdzaj dostęp do konta i podróży przy edycji rezerwacji. | ES-CO: Comprueba el acceso a la cuenta y al viaje al editar reservas.
drop policy if exists trip_reservations_update_own on public.trip_reservations;
drop policy if exists trip_reservations_update_shared on public.trip_reservations;
create policy trip_reservations_update_shared on public.trip_reservations
  for update to authenticated using (
    public.can_access_account(user_id)
    and exists (
      select 1 from public.trips
      where trips.id = trip_reservations.trip_id and public.can_access_account(trips.user_id)
    )
  ) with check (
    public.can_access_account(user_id)
    and exists (
      select 1 from public.trips
      where trips.id = trip_reservations.trip_id and public.can_access_account(trips.user_id)
    )
  );

-- PL: Ogranicz usuwanie rezerwacji do dostępnych podróży. | ES-CO: Limita el borrado de reservas a viajes accesibles.
drop policy if exists trip_reservations_delete_own on public.trip_reservations;
drop policy if exists trip_reservations_delete_shared on public.trip_reservations;
create policy trip_reservations_delete_shared on public.trip_reservations
  for delete to authenticated using (
    public.can_access_account(user_id)
    and exists (
      select 1 from public.trips
      where trips.id = trip_reservations.trip_id and public.can_access_account(trips.user_id)
    )
  );

-- PL: Udostępnij odczyt wydatków, zachowując kontrolę nad powiązanym wyjazdem. | ES-CO: Permite leer gastos manteniendo el control del viaje asociado.
drop policy if exists expenses_select_own on public.expenses;
drop policy if exists expenses_select_shared on public.expenses;
create policy expenses_select_shared on public.expenses
  for select to authenticated using (
    public.can_access_account(user_id)
    and (
      trip_id is null
      or exists (
        select 1 from public.trips
        where trips.id = expenses.trip_id and public.can_access_account(trips.user_id)
      )
    )
  );

-- PL: Pozwól dodawać wydatki wyłącznie do własnego konta i dostępnej podróży. | ES-CO: Permite insertar gastos solo en la cuenta propia y un viaje accesible.
drop policy if exists expenses_insert_own on public.expenses;
drop policy if exists expenses_insert_shared on public.expenses;
create policy expenses_insert_shared on public.expenses
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and trip_id is not null
    and exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id and public.can_access_account(trips.user_id)
    )
  );

-- PL: Ogranicz aktualizację wydatków do konta z dostępem do powiązanego wyjazdu. | ES-CO: Limita la actualización a cuentas con acceso al viaje asociado.
drop policy if exists expenses_update_own on public.expenses;
drop policy if exists expenses_update_shared on public.expenses;
create policy expenses_update_shared on public.expenses
  for update to authenticated using (
    public.can_access_account(user_id)
    and (
      trip_id is null
      or exists (
        select 1 from public.trips
        where trips.id = expenses.trip_id and public.can_access_account(trips.user_id)
      )
    )
  ) with check (
    public.can_access_account(user_id)
    and trip_id is not null
    and exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id and public.can_access_account(trips.user_id)
    )
  );

-- PL: Ogranicz usuwanie wydatków do właściciela lub powiązanego konta. | ES-CO: Limita el borrado de gastos al propietario o a una cuenta vinculada.
drop policy if exists expenses_delete_own on public.expenses;
drop policy if exists expenses_delete_shared on public.expenses;
create policy expenses_delete_shared on public.expenses
  for delete to authenticated using (
    public.can_access_account(user_id)
    and (
      trip_id is null
      or exists (
        select 1 from public.trips
        where trips.id = expenses.trip_id and public.can_access_account(trips.user_id)
      )
    )
  );

-- PL: Utwórz tabelę rezerwacji przypisanych do podróży. | ES-CO: Crea la tabla de reservas asociadas a viajes.
create table if not exists public.trip_reservations (
  -- PL: Nadaj każdej rezerwacji unikalny identyfikator UUID. | ES-CO: Asigna a cada reserva un identificador UUID único.
  id uuid primary key default gen_random_uuid(),
  -- PL: Powiąż rezerwację z właścicielem zalogowanego konta. | ES-CO: Vincula la reserva con la cuenta autenticada que la posee.
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- PL: Wskaż podróż, do której należy rezerwacja. | ES-CO: Indica el viaje al que pertenece la reserva.
  trip_id uuid not null references public.trips(id) on delete cascade,
  -- PL: Ogranicz typ rezerwacji do hotelu albo lotu. | ES-CO: Limita el tipo de reserva a hotel o vuelo.
  reservation_type text not null check (reservation_type in ('hotel', 'flight')),
  -- PL: Zachowaj nieujemną kolejność wyświetlania rezerwacji. | ES-CO: Conserva un orden de visualización no negativo.
  sort_order integer not null default 0 check (sort_order >= 0),
  -- PL: Zapisz identyfikator źródłowy używany do wykrywania duplikatów. | ES-CO: Guarda la referencia de origen para detectar duplicados.
  source_ref text not null,
  -- PL: Przechowuj nazwę lub tytuł rezerwacji. | ES-CO: Almacena el nombre o título de la reserva.
  title text not null,
  -- PL: Opcjonalnie zapisz miasto pobytu. | ES-CO: Guarda opcionalmente la ciudad de la estancia.
  city text,
  -- PL: Zapisz początek pobytu hotelowego, jeśli dotyczy. | ES-CO: Guarda el inicio de la estancia del hotel, si aplica.
  check_in date,
  -- PL: Zapisz koniec pobytu hotelowego, jeśli dotyczy. | ES-CO: Guarda el final de la estancia del hotel, si aplica.
  check_out date,
  -- PL: Przechowuj nieujemną liczbę nocy albo wartość pustą. | ES-CO: Almacena noches no negativas o un valor vacío.
  nights integer check (nights is null or nights >= 0),
  -- PL: Zapisz numer lotu dla rezerwacji lotniczej. | ES-CO: Guarda el número de vuelo para una reserva aérea.
  flight_number text,
  -- PL: Przechowuj opis trasy lotu. | ES-CO: Almacena la descripción de la ruta del vuelo.
  route text,
  -- PL: Zapisz datę lotu, jeśli rezerwacja dotyczy lotu. | ES-CO: Guarda la fecha del vuelo si la reserva es aérea.
  flight_date date,
  -- PL: Przechowuj godzinę odlotu jako tekst. | ES-CO: Almacena la hora de salida como texto.
  departure_time text,
  -- PL: Przechowuj godzinę przylotu jako tekst. | ES-CO: Almacena la hora de llegada como texto.
  arrival_time text,
  -- PL: Zapisz nazwę przewoźnika. | ES-CO: Guarda el nombre de la aerolínea.
  airline_name text,
  -- PL: Opcjonalnie zachowaj adres logo przewoźnika. | ES-CO: Conserva opcionalmente la URL del logotipo de la aerolínea.
  airline_logo text,
  -- PL: Zapisz dostawcę rezerwacji. | ES-CO: Guarda el proveedor de la reserva.
  provider text,
  -- PL: Przechowuj kod rezerwacji u dostawcy. | ES-CO: Almacena el código de reserva del proveedor.
  booking_reference text,
  -- PL: Zachowaj źródłowy zapis ceny. | ES-CO: Conserva la representación original del precio.
  price_text text,
  -- PL: Zachowaj źródłowy zapis ceny całkowitej. | ES-CO: Conserva la representación original del precio total.
  total_price_text text,
  -- PL: Zapisz nieujemną kwotę w walucie lokalnej. | ES-CO: Guarda un importe no negativo en moneda local.
  amount_local numeric(14, 2) check (amount_local is null or amount_local >= 0),
  -- PL: Określ trzyznakowy kod waluty kwoty lokalnej. | ES-CO: Indica el código de tres letras de la moneda local.
  currency_code char(3),
  -- PL: Zapisz równowartość kwoty w złotych. | ES-CO: Guarda el equivalente del importe en zlotys.
  amount_pln numeric(14, 2) check (amount_pln is null or amount_pln >= 0),
  -- PL: Przechowuj nieujemny przelicznik ceny za noc. | ES-CO: Almacena el precio por noche no negativo.
  pln_per_night numeric(18, 8) check (pln_per_night is null or pln_per_night >= 0),
  -- PL: Automatycznie zapisz czas utworzenia rezerwacji. | ES-CO: Registra automáticamente la fecha de creación de la reserva.
  created_at timestamptz not null default now(),
  -- PL: Zapobiegaj ponownemu zapisaniu tego samego źródła w podróży. | ES-CO: Evita guardar dos veces la misma referencia en un viaje.
  constraint trip_reservations_unique_source unique (trip_id, source_ref),
  -- PL: Nie pozwól, aby koniec pobytu hotelowego poprzedzał jego początek. | ES-CO: Impide que la salida del hotel sea anterior a la llegada.
  constraint trip_reservations_valid_dates check (check_in is null or check_out is null or check_out >= check_in)
);

-- PL: Przyspiesz wyszukiwanie rezerwacji właściciela, podróży i typu w kolejności widoku. | ES-CO: Acelera la búsqueda de reservas por propietario, viaje y tipo en orden de visualización.
create index if not exists trip_reservations_owner_trip_order_idx
  on public.trip_reservations (user_id, trip_id, reservation_type, sort_order);

-- PL: Wymuś kontrolę dostępu na poziomie wierszy. | ES-CO: Activa el control de acceso a nivel de fila.
alter table public.trip_reservations enable row level security;
-- PL: Usuń ogólne uprawnienia dla ról anonimowych i publicznych. | ES-CO: Revoca los permisos generales de los roles anónimo y público.
revoke all on public.trip_reservations from anon, public;
-- PL: Przyznaj zalogowanym użytkownikom operacje CRUD na tabeli. | ES-CO: Concede a usuarios autenticados operaciones CRUD sobre la tabla.
grant select, insert, update, delete on public.trip_reservations to authenticated;

-- PL: Zastąp politykę odczytu własnych rezerwacji. | ES-CO: Sustituye la política para leer las reservas propias.
drop policy if exists trip_reservations_select_own on public.trip_reservations;
-- PL: Zezwól na odczyt tylko właścicielowi i właścicielowi powiązanej podróży. | ES-CO: Permite leer solo al propietario y al propietario del viaje asociado.
create policy trip_reservations_select_own on public.trip_reservations for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid())));
-- PL: Zastąp politykę dodawania własnych rezerwacji. | ES-CO: Sustituye la política para insertar reservas propias.
drop policy if exists trip_reservations_insert_own on public.trip_reservations;
-- PL: Sprawdź właściciela rekordu i powiązanej podróży przy dodawaniu. | ES-CO: Verifica el propietario del registro y del viaje asociado al insertar.
create policy trip_reservations_insert_own on public.trip_reservations for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid())));
-- PL: Zastąp politykę aktualizowania własnych rezerwacji. | ES-CO: Sustituye la política para actualizar reservas propias.
drop policy if exists trip_reservations_update_own on public.trip_reservations;
-- PL: Wymagaj własności zarówno przed aktualizacją, jak i po niej. | ES-CO: Exige propiedad antes y después de la actualización.
create policy trip_reservations_update_own on public.trip_reservations for update to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid())));
-- PL: Zastąp politykę usuwania własnych rezerwacji. | ES-CO: Sustituye la política para eliminar reservas propias.
drop policy if exists trip_reservations_delete_own on public.trip_reservations;
-- PL: Zezwól na usunięcie tylko wtedy, gdy użytkownik jest właścicielem rekordu i podróży. | ES-CO: Permite borrar solo si el usuario es dueño del registro y del viaje.
create policy trip_reservations_delete_own on public.trip_reservations for delete to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.trips where trips.id = trip_reservations.trip_id and trips.user_id = (select auth.uid())));

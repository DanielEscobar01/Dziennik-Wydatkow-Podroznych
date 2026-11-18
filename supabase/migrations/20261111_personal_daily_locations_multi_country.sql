-- PL: Zastąp ograniczenie daty, aby jeden dzień mógł zawierać wiele krajów. | ES-CO: Sustituye la restricción de fecha para permitir varios países en un día.
alter table public.personal_daily_locations
  -- PL: Usuń unikalność pary użytkownik-data, która blokuje współdzielenie dnia. | ES-CO: Elimina la unicidad usuario-fecha que impedía compartir el día.
  drop constraint if exists personal_daily_locations_unique_date;
-- PL: Dodaj unikalność użytkownik-data-kraj, aby nie dublować tego samego kraju danego dnia. | ES-CO: Añade unicidad usuario-fecha-país para evitar repetir el país en un día.

grant update on public.personal_daily_locations to authenticated;
drop policy if exists personal_daily_locations_update_own on public.personal_daily_locations;
create policy personal_daily_locations_update_own on public.personal_daily_locations
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
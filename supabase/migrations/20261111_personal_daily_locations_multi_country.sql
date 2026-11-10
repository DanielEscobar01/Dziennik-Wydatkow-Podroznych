alter table public.personal_daily_locations
  drop constraint if exists personal_daily_locations_unique_date;

grant update on public.personal_daily_locations to authenticated;
drop policy if exists personal_daily_locations_update_own on public.personal_daily_locations;
create policy personal_daily_locations_update_own on public.personal_daily_locations
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
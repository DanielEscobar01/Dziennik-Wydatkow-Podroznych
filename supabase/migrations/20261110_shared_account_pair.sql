create table if not exists public.account_links (
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  constraint account_links_distinct_users check (user_a <> user_b),
  constraint account_links_canonical_order check (user_a < user_b)
);

alter table public.account_links enable row level security;
revoke all on public.account_links from anon, public;
grant select on public.account_links to authenticated;

drop policy if exists account_links_select_pair on public.account_links;
create policy account_links_select_pair on public.account_links
  for select to authenticated using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

create or replace function public.can_access_account(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id = (select auth.uid()) or exists (
    select 1
    from public.account_links as links
    where (links.user_a = target_user_id and links.user_b = (select auth.uid()))
       or (links.user_b = target_user_id and links.user_a = (select auth.uid()))
  );
$$;

revoke all on function public.can_access_account(uuid) from public, anon;
grant execute on function public.can_access_account(uuid) to authenticated;

drop policy if exists trips_select_own on public.trips;
drop policy if exists trips_select_shared on public.trips;
create policy trips_select_shared on public.trips
  for select to authenticated using (public.can_access_account(user_id));

drop policy if exists trips_insert_own on public.trips;
drop policy if exists trips_insert_self on public.trips;
create policy trips_insert_self on public.trips
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists trips_update_own on public.trips;
drop policy if exists trips_update_shared on public.trips;
create policy trips_update_shared on public.trips
  for update to authenticated using (public.can_access_account(user_id))
  with check (public.can_access_account(user_id));

drop policy if exists trips_delete_own on public.trips;
drop policy if exists trips_delete_shared on public.trips;
create policy trips_delete_shared on public.trips
  for delete to authenticated using (public.can_access_account(user_id));

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

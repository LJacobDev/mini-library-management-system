-- Row Level Security policies for the Mini Library Management System
-- Source: https://supabase.com/docs/guides/auth/row-level-security (consulted 2025-11-12)
-- Run AFTER schema.sql and seed.sql. Execute with the Supabase SQL editor (service role).

-- ====================================================================
-- Helper function current_user_role() is created in schema.sql and reused here.

-- ====================================================================
-- USERS table policies
-- ====================================================================

-- Allow authenticated users to read their own row. Staff (librarian/admin)
-- can see every row. Explicitly scope the policy to the authenticated role
-- per Supabase docs best practices.
create policy "users_select_self_or_staff"
  on public.users
  for select
  to authenticated
  using (
    (
      (select auth.uid()) is not null
      and id = (select auth.uid())
    )
    or current_user_role() in ('librarian','admin')
  );

-- Allow users to update their own record (profile preferences, etc.).
create policy "users_update_self"
  on public.users
  for update
  to authenticated
  using (
    (select auth.uid()) is not null
    and id = (select auth.uid())
  )
  with check (
    (select auth.uid()) is not null
    and id = (select auth.uid())
    and (
      current_user_role() = 'admin'
      or role = current_user_role()
    )
  );

-- Admins can update any user row (role changes, account flags, etc.).
create policy "users_update_admin_any"
  on public.users
  for update
  to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- Inserts into users are restricted to admins (e.g., scripted onboarding).
create policy "users_insert_admin_only"
  on public.users
  for insert
  to authenticated
  with check (current_user_role() = 'admin');

-- Deletions/soft-deletes are admin only.
create policy "users_delete_admin_only"
  on public.users
  for delete
  to authenticated
  using (current_user_role() = 'admin');

-- ====================================================================
-- PROFILES table policies
-- ====================================================================

create policy "profiles_select_self_or_staff"
  on public.profiles
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and (user_id = (select auth.uid()) or current_user_role() in ('librarian','admin'))
  );

create policy "profiles_insert_self_or_admin"
  on public.profiles
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and (
      (user_id = (select auth.uid()) and role = current_user_role())
      or current_user_role() = 'admin'
    )
  );

create policy "profiles_update_self_or_admin"
  on public.profiles
  for update
  to authenticated
  using (
    (select auth.uid()) is not null
    and (user_id = (select auth.uid()) or current_user_role() = 'admin')
  )
  with check (
    (select auth.uid()) is not null
    and (
      (user_id = (select auth.uid()) and role = current_user_role())
      or current_user_role() = 'admin'
    )
  );

create policy "profiles_delete_admin_only"
  on public.profiles
  for delete
  to authenticated
  using (current_user_role() = 'admin');

-- ====================================================================
-- MEDIA table policies
-- ====================================================================

-- Allow unauthenticated guests to browse the catalog.
create policy "media_select_public"
  on public.media
  for select
  to anon
  using (true);

-- Allow every authenticated session to read catalog records.
create policy "media_select_all_members"
  on public.media
  for select
  to authenticated
  using (true);

-- Librarian / admin staff can create, update, or delete catalog items.
create policy "media_write_staff_only"
  on public.media
  for all
  to authenticated
  using (current_user_role() in ('librarian','admin'))
  with check (current_user_role() in ('librarian','admin'));

-- ====================================================================
-- MEDIA_LOANS table policies
-- ====================================================================

-- Members can see their own loans. Staff can see everyone.
create policy "media_loans_select_self_or_staff"
  on public.media_loans
  for select
  to authenticated
  using (
    (
      (select auth.uid()) is not null
      and user_id = (select auth.uid())
    )
    or current_user_role() in ('librarian','admin')
  );

-- Only librarian/admin staff manage circulation records.
create policy "media_loans_write_staff_only"
  on public.media_loans
  for all
  to authenticated
  using (current_user_role() in ('librarian','admin'))
  with check (current_user_role() in ('librarian','admin'));

-- ====================================================================
-- MEDIA_RESERVATIONS table policies
-- ====================================================================

create policy "reservations_select_self_or_staff"
  on public.media_reservations
  for select
  to authenticated
  using (
    (
      (select auth.uid()) is not null
      and user_id = (select auth.uid())
    )
    or current_user_role() in ('librarian','admin')
  );

create policy "reservations_insert_self_or_staff"
  on public.media_reservations
  for insert
  to authenticated
  with check (
    (
      (select auth.uid()) is not null
      and user_id = (select auth.uid())
    )
    or current_user_role() in ('librarian','admin')
  );

create policy "reservations_update_staff_only"
  on public.media_reservations
  for update
  to authenticated
  using (current_user_role() in ('librarian','admin'))
  with check (current_user_role() in ('librarian','admin'));

create policy "reservations_delete_self_or_staff"
  on public.media_reservations
  for delete
  to authenticated
  using (
    (
      (select auth.uid()) is not null
      and user_id = (select auth.uid())
    )
    or current_user_role() in ('librarian','admin')
  );

-- ====================================================================
-- LOAN_EVENTS table policies
-- ====================================================================

create policy "loan_events_select_member_or_staff"
  on public.loan_events
  for select
  to authenticated
  using (
    (
      (select auth.uid()) is not null
      and exists (
        select 1
        from public.media_loans ml
        where ml.id = loan_id
          and ml.user_id = (select auth.uid())
      )
    )
    or current_user_role() in ('librarian','admin')
  );

create policy "loan_events_insert_staff_only"
  on public.loan_events
  for insert
  to authenticated
  with check (current_user_role() in ('librarian','admin'));

-- ====================================================================
-- DESK_TRANSACTIONS table policies
-- ====================================================================

create policy "desk_transactions_staff_read"
  on public.desk_transactions
  for select
  to authenticated
  using (current_user_role() in ('librarian','admin'));

create policy "desk_transactions_staff_manage"
  on public.desk_transactions
  for all
  to authenticated
  using (current_user_role() in ('librarian','admin'))
  with check (current_user_role() in ('librarian','admin'));

-- ====================================================================
-- CLIENT_LOGS table policies
-- ====================================================================

create policy "client_logs_insert_authenticated"
  on public.client_logs
  for insert
  to authenticated
  with check ((select auth.uid()) is not null);

create policy "client_logs_select_admin_only"
  on public.client_logs
  for select
  to authenticated
  using (current_user_role() = 'admin');

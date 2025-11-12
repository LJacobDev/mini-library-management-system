-- Row Level Security policies for the Mini Library Management System
-- Source: https://supabase.com/docs/guides/auth/row-level-security (consulted 2025-11-12)
-- Run AFTER schema.sql and seed.sql. Execute with the Supabase SQL editor (service role).

-- ====================================================================
-- Helper function: determine the current user's library role.
-- Uses a SECURITY DEFINER wrapper so it can read the "users" table even
-- when RLS is enabled. search_path is locked to public to avoid hijacking.
-- ====================================================================
create or replace function public.current_user_role()
returns user_role
language sql
security definer
set search_path = public
as $$
  select role
  from public.users
  where id = auth.uid()
  limit 1;
$$;

comment on function public.current_user_role() is 'Returns the application role (user_role enum) for the current authenticated user. Null when missing.';

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

-- Allow users to update their own record and staff to update anyone.
create policy "users_update_self_or_staff"
  on public.users
  for update
  to authenticated
  using (
    (
      (select auth.uid()) is not null
      and id = (select auth.uid())
    )
    or current_user_role() in ('librarian','admin')
  )
  with check (
    (
      (select auth.uid()) is not null
      and id = (select auth.uid())
    )
    or current_user_role() in ('librarian','admin')
  );

-- Inserts into users should only happen via privileged flows (admin tools
-- or backend jobs). Regular members do not create new rows here.
create policy "users_insert_staff_only"
  on public.users
  for insert
  to authenticated
  with check (current_user_role() in ('librarian','admin'));

-- Optional: block deletes to staff only. Adjust if soft-delete strategy changes.
create policy "users_delete_staff_only"
  on public.users
  for delete
  to authenticated
  using (current_user_role() in ('librarian','admin'));

-- ====================================================================
-- MEDIA table policies
-- ====================================================================

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
-- Future tables (media_holds, desk_transactions, etc.) should follow the
-- same pattern: allow members to view their own records and restrict write
-- access to librarian/admin roles.
-- ====================================================================

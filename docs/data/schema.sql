-- This file is source-of-truth documentation for the Supabase Postgres schema.
-- It is intentionally repository-owned so reviewers can inspect DB structure without logging into Supabase.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================
--  ENUMS
-- =============================

CREATE TYPE IF NOT EXISTS media_type AS ENUM ('book','video','audio','other');
CREATE TYPE IF NOT EXISTS media_format AS ENUM ('print','ebook','audiobook','dvd','blu-ray');
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('member','librarian','admin');
CREATE TYPE IF NOT EXISTS reservation_status AS ENUM ('pending','waiting','ready_for_pickup','claimed','cancelled','expired','fulfilled');
CREATE TYPE IF NOT EXISTS loan_event_type AS ENUM ('created','renewed','returned','overdue_marked','override_due_date','override_lost','override_damaged','note_added');
CREATE TYPE IF NOT EXISTS desk_transaction_type AS ENUM ('checkout','checkin','renewal','override','reservation_claim','fine_payment','note');
CREATE TYPE IF NOT EXISTS log_level AS ENUM ('debug','info','warn','error');

-- =============================
--  USERS (minimal reference table)
-- =============================
-- If Supabase Auth is used, this table can mirror the auth.users UUIDs.
-- Additional profile fields can be added in implementation.

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- =============================
--  PROFILES (extended user metadata)
-- =============================

CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  timezone text,
  notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  interests text[] NOT NULL DEFAULT '{}',
  role user_role NOT NULL DEFAULT 'member',
  app_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower ON profiles (lower(display_name));

-- =============================
--  ROLE HELPERS
-- =============================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  select coalesce(
    (
      select p.role
      from public.profiles p
      where p.user_id = auth.uid()
      limit 1
    ),
    (
      select u.role
      from public.users u
      where u.id = auth.uid()
      limit 1
    )
  );
$$;

COMMENT ON FUNCTION public.current_user_role() IS 'Returns the application role (user_role enum) for the current authenticated user. Null when missing.';

-- =============================
--  MEDIA (one row per physical/digital copy)
-- =============================

CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type media_type NOT NULL,
  media_format media_format NOT NULL DEFAULT 'print',
  title text NOT NULL,
  creator text NOT NULL,
  isbn text,
  genre text,
  subject text,
  description text,
  cover_url text,
  language varchar(8),
  pages int,
  duration_seconds int,
  published_at date,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index plan
CREATE INDEX IF NOT EXISTS idx_media_metadata_gin ON media USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_media_title_creator ON media (lower(title), lower(creator));
CREATE INDEX IF NOT EXISTS idx_media_genre_lower ON media (lower(genre));
CREATE INDEX IF NOT EXISTS idx_media_subject_lower ON media (lower(subject));
CREATE INDEX IF NOT EXISTS idx_media_media_type ON media (media_type);
CREATE INDEX IF NOT EXISTS idx_media_media_format ON media (media_format);
CREATE INDEX IF NOT EXISTS idx_media_fulltext ON media USING gin (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(subject,'') || ' ' || coalesce(genre,'') || ' ' || coalesce(creator,''))
);

-- =============================
--  MEDIA LOANS (circulation history)
-- =============================

CREATE TABLE IF NOT EXISTS media_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid REFERENCES media(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_snapshot jsonb DEFAULT NULL,
  checked_out_at timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  returned_at timestamptz,
  processed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (returned_at IS NULL OR returned_at >= checked_out_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS unq_media_active_loan ON media_loans (media_id) WHERE returned_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_media_loans_media_id ON media_loans (media_id);
CREATE INDEX IF NOT EXISTS idx_media_loans_user_id ON media_loans (user_id);
CREATE INDEX IF NOT EXISTS idx_media_loans_checked_out_at ON media_loans (checked_out_at);
CREATE INDEX IF NOT EXISTS idx_media_loans_due_date_active ON media_loans (due_date) WHERE returned_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_media_loans_returned_at ON media_loans (returned_at);

-- =============================
--  MEDIA RESERVATIONS (holds queue)
-- =============================

CREATE TABLE IF NOT EXISTS media_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position int NOT NULL CHECK (position >= 0),
  status reservation_status NOT NULL DEFAULT 'pending',
  request_id uuid NOT NULL UNIQUE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  ready_at timestamptz,
  expires_at timestamptz,
  fulfilled_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  processed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (expires_at IS NULL OR expires_at >= requested_at)
);

CREATE INDEX IF NOT EXISTS idx_media_reservations_media_status ON media_reservations (media_id, status);
CREATE INDEX IF NOT EXISTS idx_media_reservations_user_status ON media_reservations (user_id, status);
CREATE INDEX IF NOT EXISTS idx_media_reservations_position ON media_reservations (media_id, position);
CREATE UNIQUE INDEX IF NOT EXISTS unq_media_reservations_active ON media_reservations (media_id, user_id)
  WHERE status IN ('pending','waiting','ready_for_pickup');

-- =============================
--  LOAN EVENTS (idempotency + audit trail)
-- =============================

CREATE TABLE IF NOT EXISTS loan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES media_loans(id) ON DELETE CASCADE,
  event_type loan_event_type NOT NULL,
  request_id uuid,
  event_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  notes text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_events_loan_id ON loan_events (loan_id, event_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS unq_loan_events_request ON loan_events (request_id) WHERE request_id IS NOT NULL;

-- =============================
--  DESK TRANSACTIONS (front-desk activity log)
-- =============================

CREATE TABLE IF NOT EXISTS desk_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type desk_transaction_type NOT NULL,
  loan_id uuid REFERENCES media_loans(id) ON DELETE SET NULL,
  media_id uuid REFERENCES media(id) ON DELETE SET NULL,
  member_id uuid REFERENCES users(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES media_reservations(id) ON DELETE SET NULL,
  request_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  note text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_desk_transactions_occurred_at ON desk_transactions (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_desk_transactions_staff ON desk_transactions (staff_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_desk_transactions_member ON desk_transactions (member_id, occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS unq_desk_transactions_request ON desk_transactions (request_id) WHERE request_id IS NOT NULL;

-- =============================
--  CLIENT LOGS (optional client error ingestion)
-- =============================

CREATE TABLE IF NOT EXISTS client_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  route text,
  level log_level NOT NULL DEFAULT 'info',
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_logs_created_at ON client_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_logs_level ON client_logs (level);
CREATE INDEX IF NOT EXISTS idx_client_logs_user_id ON client_logs (user_id, created_at DESC);

-- =============================
--  ROLE CHANGE GUARDS
-- =============================

CREATE OR REPLACE FUNCTION public.guard_role_change_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role user_role;
BEGIN
  actor_role := current_user_role();
  IF actor_role IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role AND actor_role <> 'admin' THEN
    RAISE EXCEPTION 'Only admin can change roles' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_profile_role_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role user_role;
BEGIN
  actor_role := current_user_role();
  IF actor_role IS NULL THEN
    RETURN NEW;
  END IF;

  IF actor_role <> 'admin' AND NEW.role IS DISTINCT FROM actor_role THEN
    RAISE EXCEPTION 'Only admin can assign a different role';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_role_guard ON public.users;
CREATE TRIGGER trg_users_role_guard
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.guard_role_change_admin();

DROP TRIGGER IF EXISTS trg_profiles_role_guard ON public.profiles;
CREATE TRIGGER trg_profiles_role_guard
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_role_change_admin();

DROP TRIGGER IF EXISTS trg_profiles_role_insert_guard ON public.profiles;
CREATE TRIGGER trg_profiles_role_insert_guard
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_profile_role_insert();

-- =============================
--  TIMESTAMP TRIGGERS
-- =============================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_media_updated_at
BEFORE UPDATE ON media
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_media_loans_updated_at
BEFORE UPDATE ON media_loans
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_media_reservations_updated_at
BEFORE UPDATE ON media_reservations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_desk_transactions_updated_at
BEFORE UPDATE ON desk_transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =============================
--  ROW LEVEL SECURITY PREP
-- =============================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
-- TODO: CREATE POLICY "Users manage own profile" ON users ...

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
-- TODO: CREATE POLICY "Profiles visible to owner or staff" ON profiles ...

ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media FORCE ROW LEVEL SECURITY;
-- TODO: CREATE POLICY "Catalog read access" ON media FOR SELECT TO anon, authenticated USING (true);
-- TODO: CREATE POLICY "Catalog write access" ON media FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') IN ('librarian','admin'));

ALTER TABLE media_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_loans FORCE ROW LEVEL SECURITY;
-- TODO: CREATE POLICY "Members read own loans" ON media_loans FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));
-- TODO: CREATE POLICY "Circulation staff manage loans" ON media_loans FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') IN ('librarian','admin'));

ALTER TABLE media_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_reservations FORCE ROW LEVEL SECURITY;
-- TODO: CREATE POLICY "Members manage own reservations" ON media_reservations ...

ALTER TABLE loan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_events FORCE ROW LEVEL SECURITY;
-- TODO: CREATE POLICY "Staff view loan events" ON loan_events ...

ALTER TABLE desk_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE desk_transactions FORCE ROW LEVEL SECURITY;
-- TODO: CREATE POLICY "Staff manage desk transactions" ON desk_transactions ...

ALTER TABLE client_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_logs FORCE ROW LEVEL SECURITY;

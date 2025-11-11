-- This file is source-of-truth documentation for the Supabase Postgres schema.
-- It is intentionally repository-owned so reviewers can inspect DB structure without logging into Supabase.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================
--  ENUMS
-- =============================

CREATE TYPE IF NOT EXISTS media_type AS ENUM ('book','video','audio','other');
CREATE TYPE IF NOT EXISTS media_format AS ENUM ('print','ebook','audiobook','dvd','blu-ray');
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('member','librarian','admin');

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
--  MEDIA (one row per physical/digital copy)
-- =============================

CREATE TABLE media (
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

CREATE TABLE media_loans (
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

CREATE TRIGGER trg_media_updated_at
BEFORE UPDATE ON media
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_media_loans_updated_at
BEFORE UPDATE ON media_loans
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =============================
--  ROW LEVEL SECURITY PREP
-- =============================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
-- TODO: CREATE POLICY "Users manage own profile" ON users ...

ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media FORCE ROW LEVEL SECURITY;
-- TODO: CREATE POLICY "Catalog read access" ON media FOR SELECT TO anon, authenticated USING (true);
-- TODO: CREATE POLICY "Catalog write access" ON media FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') IN ('librarian','admin'));

ALTER TABLE media_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_loans FORCE ROW LEVEL SECURITY;
-- TODO: CREATE POLICY "Members read own loans" ON media_loans FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));
-- TODO: CREATE POLICY "Circulation staff manage loans" ON media_loans FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') IN ('librarian','admin'));

-- =============================
--  SEED DATA (illustrative sample — safe to adjust)
-- =============================

-- Sample users
INSERT INTO users (id, email, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'jane.member@example.com', 'member')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, role)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'mark.member@example.com', 'member')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, role)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'libby.librarian@example.com', 'librarian')
ON CONFLICT (id) DO NOTHING;

-- Sample media (two copies of same book + one DVD)
INSERT INTO media (id, media_type, media_format, title, creator, genre, isbn, subject, description, cover_url, language, pages, published_at, metadata)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'book', 'print', 'The Example Book', 'A. Author', 'Fiction', '978-0-000000-0', 'Modern Fiction', 'A compelling fiction title.', 'https://example.com/covers/example-book-1.jpg', 'EN', 320, '2019-03-15', '{"tags": ["staff-pick"]}'),
  ('00000000-0000-0000-0000-000000000002', 'book', 'print', 'The Example Book', 'A. Author', 'Fiction', '978-0-000000-0', 'Modern Fiction', 'Second copy of the same title.', 'https://example.com/covers/example-book-2.jpg', 'EN', 320, '2019-03-15', '{"condition": "gently-used"}'),
  ('00000000-0000-0000-0000-000000000003', 'video', 'dvd', 'Example Movie', 'D. Director', 'Drama', NULL, 'Cinema', 'Award-winning drama on DVD.', 'https://example.com/covers/example-movie.jpg', 'EN', NULL, '2021-07-01', '{"rating": "PG-13"}')
ON CONFLICT (id) DO NOTHING;

-- Sample loans (one active, one returned late)
INSERT INTO media_loans (id, media_id, user_id, checked_out_at, due_date, processed_by, note)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', now() - interval '2 days', now() + interval '12 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Checked out at circulation desk')
ON CONFLICT (id) DO NOTHING;

INSERT INTO media_loans (id, media_id, user_id, checked_out_at, due_date, returned_at, processed_by, note)
VALUES
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', now() - interval '40 days', now() - interval '26 days', now() - interval '20 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Returned 6 days late')
ON CONFLICT (id) DO NOTHING;

-- Example SELECT snippets (documentation only, optional to run)
-- List active loans for a user
-- SELECT * FROM media_loans WHERE user_id = '11111111-1111-1111-1111-111111111111' AND returned_at IS NULL ORDER BY due_date;

-- Find overdue items
-- SELECT * FROM media_loans WHERE returned_at IS NULL AND due_date < now();

-- Late return counts per user
-- SELECT user_id, count(*) AS late_returns FROM media_loans WHERE returned_at IS NOT NULL AND due_date IS NOT NULL AND returned_at > due_date GROUP BY user_id HAVING count(*) >= 1;

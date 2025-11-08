-- Mini Library Management System — canonical schema + seed data
-- This file is source-of-truth documentation for the Supabase Postgres schema.
-- It is intentionally repository-owned so reviewers can inspect DB structure without logging into Supabase.

-- =============================
--  ENUMS
-- =============================

CREATE TYPE media_type AS ENUM ('book','video','audio','other');
CREATE TYPE book_format AS ENUM ('paperback','hardcover');

-- =============================
--  USERS (minimal reference table)
-- =============================
-- If Supabase Auth is used, this table can mirror the auth.users UUIDs.
-- Additional profile fields can be added in implementation.

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  role text,
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
  title text NOT NULL,
  creator text NOT NULL,
  isbn text,
  genre text,
  subject text,
  description text,
  cover_url text,
  format text,
  book_format book_format,
  language varchar(8),
  pages int,
  duration_seconds int,
  published_at date,
  checked_out boolean NOT NULL DEFAULT false,
  checked_out_by uuid REFERENCES users(id) ON DELETE SET NULL,
  checked_out_at timestamptz,
  due_date timestamptz,
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
CREATE INDEX IF NOT EXISTS idx_media_format ON media (format);
CREATE INDEX IF NOT EXISTS idx_media_checked_out ON media (checked_out);
CREATE INDEX IF NOT EXISTS idx_media_due_date ON media (due_date) WHERE checked_out = true;
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
INSERT INTO media (id, media_type, title, creator, genre, isbn, subject, description, cover_url, format, book_format, language, pages, published_at, metadata)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'book', 'The Example Book', 'A. Author', 'Fiction', '978-0-000000-0', 'Modern Fiction', 'A compelling fiction title.', 'https://example.com/covers/example-book-1.jpg', 'print', 'paperback', 'EN', 320, '2019-03-15', '{"tags": ["staff-pick"]}'),
  ('00000000-0000-0000-0000-000000000002', 'book', 'The Example Book', 'A. Author', 'Fiction', '978-0-000000-0', 'Modern Fiction', 'Second copy of the same title.', 'https://example.com/covers/example-book-2.jpg', 'print', 'paperback', 'EN', 320, '2019-03-15', '{"condition": "gently-used"}'),
  ('00000000-0000-0000-0000-000000000003', 'video', 'Example Movie', 'D. Director', 'Drama', NULL, 'Cinema', 'Award-winning drama on DVD.', 'https://example.com/covers/example-movie.jpg', 'dvd', NULL, 'EN', NULL, '2021-07-01', '{"rating": "PG-13"}')
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

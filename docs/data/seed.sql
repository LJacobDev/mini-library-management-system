-- Seed data for Mini Library Management System
-- Run after executing schema.sql. Intended for Supabase SQL editor or psql.
-- Idempotent via ON CONFLICT DO NOTHING to support re-runs during development.

-- =============================
--  USERS (profiles / roles)
-- =============================

INSERT INTO users (id, email, role)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'avery.admin@example.com', 'admin'),
  ('10000000-0000-0000-0000-000000000002', 'liam.librarian@example.com', 'librarian'),
  ('10000000-0000-0000-0000-000000000003', 'mia.member@example.com', 'member'),
  ('10000000-0000-0000-0000-000000000004', 'nora.member@example.com', 'member')
ON CONFLICT (id) DO NOTHING;

-- Profile metadata mirrors Supabase auth roles
INSERT INTO profiles (user_id, display_name, role, timezone, notification_preferences, interests, app_metadata)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Avery Admin', 'admin', 'America/New_York', '{"email": true, "sms": false}', ARRAY['strategy','operations'], '{"title": "Director of Library Services"}'),
  ('10000000-0000-0000-0000-000000000002', 'Liam Librarian', 'librarian', 'America/Chicago', '{"email": true, "sms": true}', ARRAY['circulation','programming'], '{"desk_location": "Main"}'),
  ('10000000-0000-0000-0000-000000000003', 'Mia Member', 'member', 'America/Los_Angeles', '{"email": true, "sms": false}', ARRAY['fantasy','wellness'], '{"favorite_format": "audiobook"}'),
  ('10000000-0000-0000-0000-000000000004', 'Nora Member', 'member', 'America/Denver', '{"email": true, "sms": false}', ARRAY['documentary','makerspace'], '{"favorite_format": "dvd"}')
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  timezone = EXCLUDED.timezone,
  notification_preferences = EXCLUDED.notification_preferences,
  interests = EXCLUDED.interests,
  app_metadata = EXCLUDED.app_metadata;

-- =============================
--  MEDIA (40 sample items, 10 per media_type)
-- =============================

-- Book titles (print / ebook mix)
INSERT INTO media (id, media_type, media_format, title, creator, isbn, genre, subject, description, cover_url, language, pages, published_at, metadata)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'book', 'print', 'The Quantum Library', 'A. K. Rivera', '9780000000011', 'Science Fiction', 'Future Libraries', 'A sci-fi adventure about librarians preserving knowledge across galaxies.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-aboodi-18620004.jpg', 'EN', 384, '2023-01-15', '{"tags": ["featured", "sci-fi"]}'),
  ('20000000-0000-0000-0000-000000000002', 'book', 'print', 'Gardens of Glass', 'Emiko Tan', '9780000000012', 'Fantasy', 'Urban Fantasy', 'Stories from a city where every building doubles as a greenhouse.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-aboodi-18620004.jpg', 'EN', 312, '2021-08-10', '{"awards": ["Nebula Shortlist"]}'),
  ('20000000-0000-0000-0000-000000000003', 'book', 'print', 'The Last Archivist', 'Noah Delgado', '9780000000013', 'Thriller', 'Archival Science', 'A thriller following a records manager who uncovers a global conspiracy.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-aboodi-18620004.jpg', 'EN', 426, '2022-05-22', '{"shelf": "T1"}'),
  ('20000000-0000-0000-0000-000000000004', 'book', 'ebook', 'Metadata Matters', 'Priya Singh', '9780000000014', 'Non-fiction', 'Information Science', 'Guide to modern metadata strategies for libraries.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-aboodi-18620004.jpg', 'EN', 210, '2020-11-01', '{"format_note": "Includes interactive diagrams"}'),
  ('20000000-0000-0000-0000-000000000005', 'book', 'print', 'Cooking with Catalog Cards', 'Helena Brooks', '9780000000015', 'Humor', 'Cookbooks', 'A playful cookbook inspired by card catalog nostalgia.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-aboodi-18620004.jpg', 'EN', 168, '2019-03-02', '{"audience": "family"}'),
  ('20000000-0000-0000-0000-000000000006', 'book', 'ebook', 'Designing Quiet Spaces', 'Lars Holm', '9780000000016', 'Architecture', 'Library Design', 'Architectural case studies of serene library reading rooms.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-aboodi-18620004.jpg', 'EN', 256, '2018-09-12', '{"photography": true}'),
  ('20000000-0000-0000-0000-000000000007', 'book', 'print', 'Mysteries of the Dewey Decimal', 'Ivy Harcourt', '9780000000017', 'Mystery', 'Libraries', 'A cozy mystery solved entirely through classification clues.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-aboodi-18620004.jpg', 'EN', 298, '2024-02-17', '{"series": "Catalog Crimes"}'),
  ('20000000-0000-0000-0000-000000000008', 'book', 'print', 'Readable Robots', 'Santiago Flores', '9780000000018', 'Technology', 'Robotics', 'Exploring how humanoid robots assist in modern libraries.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-aboodi-18620004.jpg', 'EN', 340, '2023-06-05', '{"age_rating": "Teen"}'),
  ('20000000-0000-0000-0000-000000000009', 'book', 'print', 'Atlas of Imaginary Libraries', 'Camila Ortega', '9780000000019', 'Art', 'Atlases', 'Illustrated atlas of fictional libraries through history.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-aboodi-18620004.jpg', 'EN', 192, '2021-01-30', '{"illustrator": "K. Yun"}'),
  ('20000000-0000-0000-0000-000000000010', 'book', 'ebook', 'Community Knowledge Circles', 'Zahra Ali', '9780000000020', 'Sociology', 'Community', 'Case studies of community-led knowledge programs.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-aboodi-18620004.jpg', 'EN', 228, '2022-10-11', '{"case_studies": 8}')
ON CONFLICT (id) DO NOTHING;

-- Video titles (dvd / blu-ray)
INSERT INTO media (id, media_type, media_format, title, creator, genre, subject, description, cover_url, language, duration_seconds, published_at, metadata)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'video', 'dvd', 'History in Motion', 'Dana Fields', 'Documentary', 'World History', 'Documentary series exploring pivotal historical moments.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-mati-4734716.jpg', 'EN', 6120, '2019-04-18', '{"rating": "TV-PG"}'),
  ('30000000-0000-0000-0000-000000000002', 'video', 'blu-ray', 'Underwater Cities', 'Marta Zhou', 'Science', 'Marine Biology', 'A journey through futuristic underwater habitats.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-mati-4734716.jpg', 'EN', 5340, '2020-07-09', '{"narrator": "James Hollow"}'),
  ('30000000-0000-0000-0000-000000000003', 'video', 'dvd', 'Library Nights', 'Jonah Reeves', 'Drama', 'Libraries', 'Anthology of short films set in libraries around the world.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-mati-4734716.jpg', 'EN', 4680, '2021-11-02', '{"episodes": 6}'),
  ('30000000-0000-0000-0000-000000000004', 'video', 'blu-ray', 'Restoration Lab', 'Yuna Kim', 'Educational', 'Preservation', 'Demonstrations of archival restoration techniques.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-mati-4734716.jpg', 'EN', 4020, '2018-05-14', '{"subtitles": ["EN", "ES"]}'),
  ('30000000-0000-0000-0000-000000000005', 'video', 'dvd', 'Voices of the Stacks', 'Elias Monroe', 'Biography', 'Librarians', 'Profiles of librarians making community impact.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-mati-4734716.jpg', 'EN', 3720, '2022-03-08', '{"festival": "DocWorld"}'),
  ('30000000-0000-0000-0000-000000000006', 'video', 'dvd', 'Mapping Memory', 'Gita Bhaskar', 'Documentary', 'Cartography', 'Exploring the history of maps in library collections.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-mati-4734716.jpg', 'EN', 3960, '2023-09-19', '{"age_rating": "All"}'),
  ('30000000-0000-0000-0000-000000000007', 'video', 'blu-ray', 'Codex Quest', 'Franco Cardozo', 'Adventure', 'Historical Fiction', 'Treasure hunt to recover a lost illuminated manuscript.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-mati-4734716.jpg', 'EN', 5460, '2024-01-05', '{"series": "Chronicle Films"}'),
  ('30000000-0000-0000-0000-000000000008', 'video', 'dvd', 'Learning Lens', 'Silvia Park', 'Educational', 'Media Literacy', 'Media literacy workshops captured on film.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-mati-4734716.jpg', 'EN', 2880, '2020-02-20', '{"lesson_plans": true}'),
  ('30000000-0000-0000-0000-000000000009', 'video', 'dvd', 'Stories on Wheels', 'Rafi Cortez', 'Family', 'Outreach', 'Library bookmobile adventures serving rural communities.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-mati-4734716.jpg', 'EN', 3420, '2021-06-27', '{"age_rating": "Family"}'),
  ('30000000-0000-0000-0000-000000000010', 'video', 'blu-ray', 'Digital Heritage', 'Amina Farouk', 'Documentary', 'Digital Preservation', 'How archivists preserve born-digital collections.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-mati-4734716.jpg', 'EN', 4380, '2019-12-12', '{"sponsor": "MuseumNet"}')
ON CONFLICT (id) DO NOTHING;

-- Audio titles (audiobook focus)
INSERT INTO media (id, media_type, media_format, title, creator, genre, subject, description, cover_url, language, duration_seconds, published_at, metadata)
VALUES
  ('40000000-0000-0000-0000-000000000001', 'audio', 'audiobook', 'Mindful Moments', 'Serenity Studios', 'Wellness', 'Meditation', 'Guided meditations for busy professionals.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-chuck-3587478.jpg', 'EN', 8100, '2020-04-14', '{"narrator": "Grace Lin"}'),
  ('40000000-0000-0000-0000-000000000002', 'audio', 'audiobook', 'Voices of the Archive', 'Archive Audio', 'History', 'Oral History', 'First-hand accounts from archivists across generations.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-chuck-3587478.jpg', 'EN', 9300, '2021-08-19', '{"chapters": 12}'),
  ('40000000-0000-0000-0000-000000000003', 'audio', 'audiobook', 'Shelving Soundscapes', 'DJ Dewey', 'Ambient', 'Focus Music', 'Lo-fi ambiance inspired by library atmospheres.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-chuck-3587478.jpg', 'EN', 7200, '2019-10-05', '{"bpm": 72}'),
  ('40000000-0000-0000-0000-000000000004', 'audio', 'audiobook', 'Code & Catalogs', 'TechReads Audio', 'Technology', 'Library Systems', 'Interviews with ILS engineers.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-chuck-3587478.jpg', 'EN', 9540, '2022-07-21', '{"series": "TechReads"}'),
  ('40000000-0000-0000-0000-000000000005', 'audio', 'audiobook', 'Storytime in the Clouds', 'Skyline Press', 'Children', 'Storytelling', 'Bedtime tales narrated with atmospheric sound effects.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-chuck-3587478.jpg', 'EN', 6840, '2021-12-03', '{"age_range": "4-8"}'),
  ('40000000-0000-0000-0000-000000000006', 'audio', 'audiobook', 'The Reference Desk', 'Lena Ross', 'Drama', 'Libraries', 'Serialized drama about the dynamics of a busy reference desk.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-chuck-3587478.jpg', 'EN', 8460, '2023-03-28', '{"season": 1}'),
  ('40000000-0000-0000-0000-000000000007', 'audio', 'audiobook', 'Language Lab Live', 'Polyglot Audio', 'Education', 'Language Learning', 'Conversational practice sessions recorded with live learners.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-chuck-3587478.jpg', 'EN', 9000, '2018-06-16', '{"languages": ["EN", "ES", "FR"]}'),
  ('40000000-0000-0000-0000-000000000008', 'audio', 'audiobook', 'Shelf Talkers', 'Community Voices', 'Non-fiction', 'Community', 'Local authors share readings from upcoming releases.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-chuck-3587478.jpg', 'EN', 7800, '2024-04-09', '{"events": true}'),
  ('40000000-0000-0000-0000-000000000009', 'audio', 'audiobook', 'Archivist Anecdotes', 'Chronicle Audio', 'Biography', 'Archivists', 'Personal stories from archivists handling rare collections.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-chuck-3587478.jpg', 'EN', 8880, '2020-09-25', '{"volume": 2}'),
  ('40000000-0000-0000-0000-000000000010', 'audio', 'audiobook', 'Soundtrack for Study Halls', 'FocusFlow', 'Instrumental', 'Study Music', 'Instrumental tracks designed for intense study sessions.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-chuck-3587478.jpg', 'EN', 7560, '2019-02-14', '{"mood": "calm"}')
ON CONFLICT (id) DO NOTHING;

-- Other media (equipment / kits / misc)
INSERT INTO media (id, media_type, media_format, title, creator, genre, subject, description, cover_url, language, metadata)
VALUES
  ('50000000-0000-0000-0000-000000000001', 'other', 'print', 'Makerspace Arduino Kit', 'Library Labs', 'STEM', 'Electronics', 'Starter kit with microcontrollers and sensors.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-scottwebb-2824173.jpg', 'EN', '{"components": ["Arduino Uno", "LED pack", "Breadboard"]}'),
  ('50000000-0000-0000-0000-000000000002', 'other', 'print', '3D Printing Workshop Tools', 'Library Labs', 'STEM', 'Fabrication', 'Toolkit for 3D printing classes.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-scottwebb-2824173.jpg', 'EN', '{"includes": ["calipers", "spatula", "safety goggles"]}'),
  ('50000000-0000-0000-0000-000000000003', 'other', 'print', 'Podcast Recording Kit', 'Community Media', 'Audio Production', 'Media Production', 'Portable podcast equipment bundle.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-scottwebb-2824173.jpg', 'EN', '{"equipment": ["USB mic", "Headphones", "Pop filter"]}'),
  ('50000000-0000-0000-0000-000000000004', 'other', 'print', 'STEM Exploration Backpack', 'Discovery Outreach', 'Education', 'STEM', 'Backpack with STEM activities for families.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-scottwebb-2824173.jpg', 'EN', '{"age_range": "8-12"}'),
  ('50000000-0000-0000-0000-000000000005', 'other', 'print', 'Historic Map Reproduction Set', 'Archive Editions', 'History', 'Cartography', 'High-quality reproductions of local historical maps.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-scottwebb-2824173.jpg', 'EN', '{"maps": 5}'),
  ('50000000-0000-0000-0000-000000000006', 'other', 'print', 'Storytime Puppet Pack', 'Community Programs', 'Children', 'Storytelling', 'Puppets for animated storytime sessions.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-scottwebb-2824173.jpg', 'EN', '{"puppets": ["dragon", "fox", "owl"]}'),
  ('50000000-0000-0000-0000-000000000007', 'other', 'print', 'Local History Oral Kit', 'Heritage Voices', 'History', 'Oral History', 'Equipment set for recording oral histories.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-scottwebb-2824173.jpg', 'EN', '{"includes": ["recorder", "mic", "question prompts"]}'),
  ('50000000-0000-0000-0000-000000000008', 'other', 'print', 'STEM Robots Loan Set', 'Tech Outreach', 'Education', 'Robotics', 'Pack of programmable robots for classroom demos.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-scottwebb-2824173.jpg', 'EN', '{"units": 6}'),
  ('50000000-0000-0000-0000-000000000009', 'other', 'print', 'Photography Field Kit', 'Creative Commons', 'Photography', 'Workshops', 'DSLR camera kit for community photography walks.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-scottwebb-2824173.jpg', 'EN', '{"camera": "DSLR", "lenses": 2}'),
  ('50000000-0000-0000-0000-000000000010', 'other', 'print', 'Board Game Night Bundle', 'Community Services', 'Recreation', 'Games', 'Curated set of strategy board games.', 'https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/fallback-images/pexels-scottwebb-2824173.jpg', 'EN', '{"games": ["Catan", "Ticket to Ride", "Azul"]}')
ON CONFLICT (id) DO NOTHING;

-- =============================
--  MEDIA LOANS (mix of active/overdue/returned)
-- =============================

INSERT INTO media_loans (id, media_id, user_id, user_snapshot, checked_out_at, due_date, returned_at, processed_by, note)
VALUES
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '{"name": "Mia Member"}', now() - interval '4 days', now() + interval '10 days', NULL, '10000000-0000-0000-0000-000000000002', 'Active loan'),
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '{"name": "Mia Member"}', now() - interval '20 days', now() - interval '6 days', NULL, '10000000-0000-0000-0000-000000000002', 'Overdue loan'),
  ('60000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '{"name": "Mia Member"}', now() - interval '35 days', now() - interval '21 days', now() - interval '18 days', '10000000-0000-0000-0000-000000000002', 'Returned on time'),
  ('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '{"name": "Mia Member"}', now() - interval '8 days', now() + interval '6 days', NULL, '10000000-0000-0000-0000-000000000002', 'Equipment kit loan')
ON CONFLICT (id) DO NOTHING;

-- =============================
--  MEDIA RESERVATIONS (queue samples)
-- =============================

INSERT INTO media_reservations (id, media_id, user_id, position, status, request_id, requested_at, ready_at, expires_at, processed_by)
VALUES
  ('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 0, 'ready_for_pickup', '71000000-0000-0000-0000-000000000001', now() - interval '2 days', now() - interval '2 hours', now() + interval '70 hours', '10000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 1, 'waiting', '71000000-0000-0000-0000-000000000002', now() - interval '1 day', NULL, NULL, NULL),
  ('70000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 0, 'pending', '71000000-0000-0000-0000-000000000003', now() - interval '3 hours', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================
--  LOAN EVENTS (idempotent audit trail)
-- =============================

INSERT INTO loan_events (id, loan_id, event_type, request_id, event_at, actor_id, notes, payload)
VALUES
  ('72000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'created', '73000000-0000-0000-0000-000000000001', now() - interval '4 days', '10000000-0000-0000-0000-000000000002', 'Checkout initiated at desk', jsonb_build_object('due_date', now() + interval '10 days')),
  ('72000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000003', 'returned', '73000000-0000-0000-0000-000000000002', now() - interval '18 days', '10000000-0000-0000-0000-000000000002', 'Item returned in good condition', jsonb_build_object('condition_note', 'sleeve cleaned'))
ON CONFLICT (id) DO NOTHING;

-- =============================
--  DESK TRANSACTIONS (circulation desk history)
-- =============================

INSERT INTO desk_transactions (id, transaction_type, loan_id, media_id, member_id, staff_id, request_id, note)
VALUES
  ('74000000-0000-0000-0000-000000000001', 'checkout', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '75000000-0000-0000-0000-000000000001', 'Checkout processed with 14-day loan'),
  ('74000000-0000-0000-0000-000000000002', 'checkin', '60000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '75000000-0000-0000-0000-000000000002', 'Check-in completed; audio discs inspected')
ON CONFLICT (id) DO NOTHING;

-- =============================
--  CLIENT LOGS (sample client telemetry)
-- =============================

INSERT INTO client_logs (user_id, route, level, message, context)
VALUES
  ('10000000-0000-0000-0000-000000000003', '/account/loans', 'info', 'Hydrated member loan dashboard', '{"loanCount": 3}')
ON CONFLICT DO NOTHING;

-- =============================
--  OPTIONAL: FUTURE TABLE PLACEHOLDERS
-- =============================
-- If tables such as media_holds or desk_transactions are introduced, extend this
-- script with similar INSERT statements referencing the seeded user/media IDs.

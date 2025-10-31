-- Full-Text Search Test Suite
-- Run these queries to verify full-text search is working correctly

-- ============================================
-- 1. VERIFY SCHEMA CHANGES
-- ============================================

-- Check searchVector columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('Church', 'Sermon', 'Event')
  AND column_name = 'searchVector';

-- Check GIN indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname LIKE '%searchVector%';

-- Check triggers exist
SELECT tgname, tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname LIKE '%search%';

-- ============================================
-- 2. VERIFY SEARCH VECTOR POPULATION
-- ============================================

-- Count records with populated searchVector
SELECT
  (SELECT COUNT(*) FROM "Church" WHERE "searchVector" IS NOT NULL) as churches_with_search,
  (SELECT COUNT(*) FROM "Sermon" WHERE "searchVector" IS NOT NULL) as sermons_with_search,
  (SELECT COUNT(*) FROM "Event" WHERE "searchVector" IS NOT NULL) as events_with_search;

-- ============================================
-- 3. TEST CHURCH SEARCH
-- ============================================

-- Simple church search (replace 'test' with actual search term)
SELECT
  name,
  description,
  ts_rank("searchVector", plainto_tsquery('english', 'church')) as rank
FROM "Church"
WHERE "searchVector" @@ plainto_tsquery('english', 'church')
  AND "isDeleted" = false
  AND "isPublished" = true
ORDER BY rank DESC
LIMIT 10;

-- Church search with profile content
SELECT
  c.name,
  c.description,
  cp."whoWeAre",
  ts_rank(c."searchVector", plainto_tsquery('english', 'faith')) as rank
FROM "Church" c
LEFT JOIN "ChurchProfile" cp ON cp."churchId" = c.id
WHERE c."searchVector" @@ plainto_tsquery('english', 'faith')
  AND c."isDeleted" = false
  AND c."isPublished" = true
ORDER BY rank DESC
LIMIT 10;

-- ============================================
-- 4. TEST SERMON SEARCH
-- ============================================

-- Sermon search
SELECT
  title,
  passage,
  description,
  preacher,
  ts_rank("searchVector", plainto_tsquery('english', 'prayer')) as rank
FROM "Sermon"
WHERE "searchVector" @@ plainto_tsquery('english', 'prayer')
ORDER BY rank DESC
LIMIT 10;

-- Sermon search within specific church
SELECT
  s.title,
  s.passage,
  s.description,
  c.name as church_name,
  ts_rank(s."searchVector", plainto_tsquery('english', 'grace')) as rank
FROM "Sermon" s
JOIN "Church" c ON c.id = s."churchId"
WHERE s."searchVector" @@ plainto_tsquery('english', 'grace')
  -- Replace with actual church ID to test churchId filter
  -- AND s."churchId" = 'your-church-id-here'
ORDER BY rank DESC
LIMIT 10;

-- ============================================
-- 5. TEST EVENT SEARCH
-- ============================================

-- Search upcoming events
SELECT
  title,
  description,
  "startDate",
  ts_rank("searchVector", plainto_tsquery('english', 'worship')) as rank
FROM "Event"
WHERE "searchVector" @@ plainto_tsquery('english', 'worship')
  AND "startDate" >= NOW()
ORDER BY rank DESC, "startDate" ASC
LIMIT 10;

-- Search all events (including past)
SELECT
  title,
  description,
  "startDate",
  ts_rank("searchVector", plainto_tsquery('english', 'service')) as rank
FROM "Event"
WHERE "searchVector" @@ plainto_tsquery('english', 'service')
ORDER BY rank DESC, "startDate" ASC
LIMIT 10;

-- ============================================
-- 6. TEST TRIGGER FUNCTIONALITY
-- ============================================

-- Test: Update a church and verify searchVector updates
-- (Run these in sequence)

-- Step 1: Check current searchVector for a church
SELECT id, name, description, "searchVector"
FROM "Church"
LIMIT 1;

-- Step 2: Update the church name (replace ID with actual ID from Step 1)
-- UPDATE "Church"
-- SET name = 'Updated Test Church Name'
-- WHERE id = 'your-church-id-here';

-- Step 3: Verify searchVector was updated
-- SELECT id, name, description, "searchVector"
-- FROM "Church"
-- WHERE id = 'your-church-id-here';

-- Step 4: Test that new search term is found
-- SELECT name,
--        ts_rank("searchVector", plainto_tsquery('english', 'Updated')) as rank
-- FROM "Church"
-- WHERE id = 'your-church-id-here';

-- ============================================
-- 7. TEST CHURCHPROFILE TRIGGER
-- ============================================

-- Test: Update ChurchProfile and verify Church searchVector updates

-- Step 1: Get a church with a profile
SELECT c.id, c.name, cp."whoWeAre"
FROM "Church" c
JOIN "ChurchProfile" cp ON cp."churchId" = c.id
LIMIT 1;

-- Step 2: Update the profile (replace ID with actual churchId from Step 1)
-- UPDATE "ChurchProfile"
-- SET "whoWeAre" = 'We are a community of believers seeking to glorify God'
-- WHERE "churchId" = 'your-church-id-here';

-- Step 3: Verify Church searchVector includes new content
-- SELECT name,
--        ts_rank("searchVector", plainto_tsquery('english', 'glorify')) as rank
-- FROM "Church"
-- WHERE id = 'your-church-id-here';

-- ============================================
-- 8. PERFORMANCE TESTING
-- ============================================

-- Check that GIN index is being used
EXPLAIN ANALYZE
SELECT name
FROM "Church"
WHERE "searchVector" @@ plainto_tsquery('english', 'church')
  AND "isDeleted" = false
  AND "isPublished" = true
LIMIT 10;

-- Should show "Bitmap Index Scan" or "Index Scan" on searchVector_idx

-- ============================================
-- 9. MULTI-WORD SEARCH TESTS
-- ============================================

-- Test multi-word search (plainto_tsquery handles this automatically)
SELECT
  name,
  description,
  ts_rank("searchVector", plainto_tsquery('english', 'community church')) as rank
FROM "Church"
WHERE "searchVector" @@ plainto_tsquery('english', 'community church')
  AND "isDeleted" = false
  AND "isPublished" = true
ORDER BY rank DESC
LIMIT 10;

-- ============================================
-- 10. SEARCH STATISTICS
-- ============================================

-- Get statistics on searchVector sizes
SELECT
  'Church' as table_name,
  AVG(length("searchVector"::text)) as avg_vector_size,
  MAX(length("searchVector"::text)) as max_vector_size
FROM "Church"
WHERE "searchVector" IS NOT NULL
UNION ALL
SELECT
  'Sermon' as table_name,
  AVG(length("searchVector"::text)) as avg_vector_size,
  MAX(length("searchVector"::text)) as max_vector_size
FROM "Sermon"
WHERE "searchVector" IS NOT NULL
UNION ALL
SELECT
  'Event' as table_name,
  AVG(length("searchVector"::text)) as avg_vector_size,
  MAX(length("searchVector"::text)) as max_vector_size
FROM "Event"
WHERE "searchVector" IS NOT NULL;

-- Get top 10 most common words in search vectors (requires some records)
-- SELECT word, ndoc
-- FROM ts_stat('SELECT "searchVector" FROM "Church"')
-- ORDER BY ndoc DESC
-- LIMIT 10;

-- Add tsvector columns for full-text search
ALTER TABLE "Church" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
ALTER TABLE "Sermon" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Create GIN indexes for fast full-text search
CREATE INDEX IF NOT EXISTS "Church_searchVector_idx" ON "Church" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "Sermon_searchVector_idx" ON "Sermon" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "Event_searchVector_idx" ON "Event" USING GIN ("searchVector");

-- Create function to update Church search vector
CREATE OR REPLACE FUNCTION church_search_vector_update() RETURNS trigger AS $$
DECLARE
  profile_text text;
BEGIN
  -- Get profile text if it exists
  SELECT COALESCE(
    COALESCE("whoWeAre", '') || ' ' ||
    COALESCE("vision", '') || ' ' ||
    COALESCE("storyOfChurch", '') || ' ' ||
    COALESCE("statementOfFaith", '')
  , '')
  INTO profile_text
  FROM "ChurchProfile"
  WHERE "churchId" = NEW.id;

  -- Update search vector with church name and profile content
  -- Weight: A (highest) for name, B for description, C for profile content
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(profile_text, '')), 'C');

  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for Church
DROP TRIGGER IF EXISTS church_search_vector_trigger ON "Church";
CREATE TRIGGER church_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Church"
  FOR EACH ROW
  EXECUTE FUNCTION church_search_vector_update();

-- Create trigger to update Church when ChurchProfile changes
CREATE OR REPLACE FUNCTION church_profile_update_church() RETURNS trigger AS $$
BEGIN
  -- Trigger an update on the related Church record to regenerate search vector
  UPDATE "Church" SET "updatedAt" = NOW() WHERE id = NEW."churchId";
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS church_profile_update_trigger ON "ChurchProfile";
CREATE TRIGGER church_profile_update_trigger
  AFTER INSERT OR UPDATE ON "ChurchProfile"
  FOR EACH ROW
  EXECUTE FUNCTION church_profile_update_church();

-- Create function for Sermon search vector
CREATE OR REPLACE FUNCTION sermon_search_vector_update() RETURNS trigger AS $$
BEGIN
  -- Weight: A (highest) for title, B for passage, C for description
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.passage, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for Sermon
DROP TRIGGER IF EXISTS sermon_search_vector_trigger ON "Sermon";
CREATE TRIGGER sermon_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Sermon"
  FOR EACH ROW
  EXECUTE FUNCTION sermon_search_vector_update();

-- Create function for Event search vector
CREATE OR REPLACE FUNCTION event_search_vector_update() RETURNS trigger AS $$
BEGIN
  -- Weight: A (highest) for title, B for description
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for Event
DROP TRIGGER IF EXISTS event_search_vector_trigger ON "Event";
CREATE TRIGGER event_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Event"
  FOR EACH ROW
  EXECUTE FUNCTION event_search_vector_update();

-- Update existing Church records (initial population)
UPDATE "Church" c SET "searchVector" =
  setweight(to_tsvector('english', COALESCE(c.name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(c.description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(
    (SELECT COALESCE(
      COALESCE(cp."whoWeAre", '') || ' ' ||
      COALESCE(cp."vision", '') || ' ' ||
      COALESCE(cp."storyOfChurch", '') || ' ' ||
      COALESCE(cp."statementOfFaith", '')
    , '')
    FROM "ChurchProfile" cp
    WHERE cp."churchId" = c.id)
  , '')), 'C')
WHERE c."searchVector" IS NULL;

-- Update existing Sermon records (initial population)
UPDATE "Sermon" SET "searchVector" =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(passage, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C')
WHERE "searchVector" IS NULL;

-- Update existing Event records (initial population)
UPDATE "Event" SET "searchVector" =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
WHERE "searchVector" IS NULL;

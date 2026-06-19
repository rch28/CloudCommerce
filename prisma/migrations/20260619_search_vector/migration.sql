-- Add full-text search vector column and GIN index for product search
-- This enables efficient full-text search across product names and descriptions

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_searchVector_idx" ON "Product" USING GIN("searchVector");

-- Trigger function to keep searchVector updated
CREATE OR REPLACE FUNCTION product_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."shortDescription", '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_search_vector_trigger ON "Product";
CREATE TRIGGER product_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, "shortDescription", description
  ON "Product"
  FOR EACH ROW
  EXECUTE FUNCTION product_search_vector_update();

-- Backfill existing rows
UPDATE "Product" SET "searchVector" =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("shortDescription", '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C');

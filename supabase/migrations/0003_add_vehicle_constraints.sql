-- Add DB-level constraints that mirror Zod schema validation
-- Prevents direct API inserts from bypassing client-side limits
ALTER TABLE vehicles
  ADD CONSTRAINT vehicles_make_length
    CHECK (char_length(make) >= 1 AND char_length(make) <= 100),
  ADD CONSTRAINT vehicles_model_length
    CHECK (char_length(model) >= 1 AND char_length(model) <= 100),
  ADD CONSTRAINT vehicles_year_range
    CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW())::integer + 1),
  ADD CONSTRAINT vehicles_nickname_length
    CHECK (nickname IS NULL OR char_length(nickname) <= 100),
  ADD CONSTRAINT vehicles_notes_length
    CHECK (notes IS NULL OR char_length(notes) <= 500);

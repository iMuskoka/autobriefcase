-- Migration: 0005_document_extracted_fields
-- Adds AI-extracted fields to the documents table (Story 4.1)

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS expiry_date   DATE NULL,
  ADD COLUMN IF NOT EXISTS holder_name   TEXT NULL,
  ADD COLUMN IF NOT EXISTS policy_number TEXT NULL,
  ADD COLUMN IF NOT EXISTS issuer_name   TEXT NULL;

-- No new RLS policies needed — existing FOR ALL USING (auth.uid() = user_id)
-- policy covers all columns including the new nullable ones.

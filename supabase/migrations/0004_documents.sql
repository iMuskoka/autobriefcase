-- Migration: 0004_documents
-- Documents table, RLS, updated_at trigger, Supabase Storage bucket + policies

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  vehicle_id    UUID        NOT NULL REFERENCES vehicles(id)     ON DELETE CASCADE,
  storage_path  TEXT        NOT NULL,
  document_type TEXT        NOT NULL,
  file_name     TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own documents"
  ON documents FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Performance index
CREATE INDEX idx_documents_vehicle_id ON documents(vehicle_id);

-- updated_at trigger (CREATE OR REPLACE so future migrations can reuse)
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Supabase Storage private bucket
INSERT INTO storage.buckets (id, name, public)
  VALUES ('vehicle-documents', 'vehicle-documents', false)
  ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own files
-- Storage path format: {userId}/{vehicleId}/{timestamp}-{fileName}
-- (storage.foldername(name))[1] extracts the first path segment (userId)

CREATE POLICY "users can upload own documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users can read own documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vehicle-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users can delete own documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'vehicle-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

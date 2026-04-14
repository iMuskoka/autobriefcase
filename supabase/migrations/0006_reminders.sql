-- Migration: 0006_reminders
-- Adds reminders table for renewal tracking (Story 5.1)
CREATE TABLE IF NOT EXISTS reminders (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id     UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_id    UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  expiry_date    DATE        NOT NULL,
  lead_time_days INTEGER     NOT NULL DEFAULT 30,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'sent', 'dismissed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own reminders"
  ON reminders FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX idx_reminders_document_id ON reminders (document_id);
CREATE INDEX idx_reminders_expiry_date ON reminders (expiry_date);
CREATE INDEX idx_reminders_user_status ON reminders (user_id, status);

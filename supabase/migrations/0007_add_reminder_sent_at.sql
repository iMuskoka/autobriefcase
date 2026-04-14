-- Migration: 0007_add_reminder_sent_at
-- Adds sent_at column to reminders for delivery audit trail (Story 5.2)
ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

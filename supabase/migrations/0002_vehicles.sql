-- vehicles: one row per fleet vehicle, owned by a user
CREATE TABLE vehicles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    TEXT        NOT NULL CHECK (category IN (
                'car','motorcycle','boat','pwc','snowmobile','atv','seasonal_pass'
              )),
  make        TEXT        NOT NULL,
  model       TEXT        NOT NULL,
  year        INTEGER     NOT NULL,
  nickname    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS — required on every table (ARCH-04)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles: select own"
  ON vehicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "vehicles: insert own"
  ON vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vehicles: update own"
  ON vehicles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vehicles: delete own"
  ON vehicles FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);

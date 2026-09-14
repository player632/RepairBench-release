-- Add effective_wpm column (wpm * accuracy / 100)
ALTER TABLE scores ADD COLUMN effective_wpm real;

-- Backfill existing data
UPDATE scores SET effective_wpm = wpm * (accuracy / 100);

-- Make it NOT NULL with a default for future inserts
ALTER TABLE scores ALTER COLUMN effective_wpm SET NOT NULL;
ALTER TABLE scores ALTER COLUMN effective_wpm SET DEFAULT 0;

-- Replace old leaderboard index with one sorted by effective_wpm
DROP INDEX IF EXISTS idx_scores_leaderboard;
CREATE INDEX idx_scores_leaderboard
  ON scores (language, difficulty, duration, number_addon, symbol_addon, effective_wpm DESC);

-- Allow anonymous updates (if not already created)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous update' AND tablename = 'scores'
  ) THEN
    CREATE POLICY "Allow anonymous update" ON scores FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END
$$;

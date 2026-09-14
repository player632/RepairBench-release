-- Scores table for anonymous leaderboard
CREATE TABLE scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  user_name text NOT NULL DEFAULT 'Anonymous',
  fingerprint text NOT NULL,
  wpm integer NOT NULL,
  accuracy real NOT NULL,
  language text NOT NULL,
  difficulty text NOT NULL,
  duration integer NOT NULL,
  number_addon boolean NOT NULL DEFAULT false,
  symbol_addon boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast leaderboard queries per mode combination
CREATE INDEX idx_scores_leaderboard
  ON scores (language, difficulty, duration, number_addon, symbol_addon, wpm DESC);

-- Enable Row Level Security
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (Supabase anon key)
CREATE POLICY "Allow anonymous insert" ON scores
  FOR INSERT WITH CHECK (true);

-- Allow anonymous reads
CREATE POLICY "Allow anonymous read" ON scores
  FOR SELECT USING (true);

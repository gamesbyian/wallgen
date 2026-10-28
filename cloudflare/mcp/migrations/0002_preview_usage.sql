-- One owner-scoped, UTC-day charge per paid Browser Run render.
-- Atomic UPSERT ensures concurrent calls cannot bypass the daily ceiling.
CREATE TABLE IF NOT EXISTS preview_usage (
  owner TEXT NOT NULL,
  day TEXT NOT NULL,
  used INTEGER NOT NULL CHECK (used >= 1 AND used <= 30),
  PRIMARY KEY (owner, day)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS preview_usage_by_day ON preview_usage (day);

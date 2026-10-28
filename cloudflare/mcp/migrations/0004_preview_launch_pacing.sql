-- Global browser launch cadence is account-scoped, not per user.
-- D1 UPSERT reserves the next launch across all edge isolates.
CREATE TABLE IF NOT EXISTS preview_launch_pacing (
  key TEXT PRIMARY KEY,
  last_launch_at INTEGER NOT NULL
) WITHOUT ROWID;

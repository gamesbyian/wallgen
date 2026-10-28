-- One cost-bounded browser job across all edge isolates, not per process.
-- A 120-second expiry is enforced by acquisition and recovered on crash.
CREATE TABLE IF NOT EXISTS preview_leases (
  lease_key TEXT NOT NULL PRIMARY KEY,
  token TEXT NOT NULL,
  acquired_at INTEGER NOT NULL
) WITHOUT ROWID;

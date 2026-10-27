CREATE TABLE IF NOT EXISTS designs (
  owner TEXT NOT NULL,
  id TEXT NOT NULL,
  object_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (owner, id)
);
CREATE INDEX IF NOT EXISTS designs_owner_created ON designs(owner, created_at DESC);

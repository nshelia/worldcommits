CREATE TABLE IF NOT EXISTS completion_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  git_user TEXT NOT NULL,
  git_email TEXT NOT NULL,
  completion_type TEXT NOT NULL,
  completion_status TEXT NOT NULL,
  completion_word_count INTEGER NOT NULL DEFAULT 0 CHECK (completion_word_count >= 0),
  files_edited_count INTEGER NOT NULL DEFAULT 0 CHECK (files_edited_count >= 0),
  files_edited_json TEXT NOT NULL DEFAULT '[]',
  project TEXT,
  client TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_completion_events_git_email
  ON completion_events (git_email);

CREATE INDEX IF NOT EXISTS idx_completion_events_git_user
  ON completion_events (git_user);

CREATE INDEX IF NOT EXISTS idx_completion_events_created_at
  ON completion_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_completion_events_completion_type
  ON completion_events (completion_type);

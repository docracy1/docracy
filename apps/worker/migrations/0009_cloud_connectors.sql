CREATE TABLE cloud_connections (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK(provider IN ('dropbox','onedrive','box')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TEXT,
  connected_email TEXT,
  box_folder_id TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(account_id, provider)
);
CREATE INDEX idx_cloud_connections_account ON cloud_connections(account_id);

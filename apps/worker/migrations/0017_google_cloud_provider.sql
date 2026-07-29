-- Allow Google Drive as a cloud connector provider, and store its folder id
-- the same way Box stores box_folder_id.
PRAGMA foreign_keys = OFF;

CREATE TABLE cloud_connections_new (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK(provider IN ('dropbox','onedrive','box','google')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TEXT,
  connected_email TEXT,
  box_folder_id TEXT,
  google_folder_id TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(account_id, provider)
);

INSERT INTO cloud_connections_new (
  id, account_id, provider, access_token, refresh_token, expires_at,
  connected_email, box_folder_id, google_folder_id, created_at
)
SELECT
  id, account_id, provider, access_token, refresh_token, expires_at,
  connected_email, box_folder_id, NULL, created_at
FROM cloud_connections;

DROP TABLE cloud_connections;
ALTER TABLE cloud_connections_new RENAME TO cloud_connections;

CREATE INDEX idx_cloud_connections_account ON cloud_connections(account_id);

PRAGMA foreign_keys = ON;

-- Admin-authored blog posts, published via the admin panel with no code deploy needed. Kept
-- separate from the 4 existing hand-coded competitor-comparison articles in
-- apps/web/src/lib/blog.ts, which stay exactly as they are (no migration of their content).
CREATE TABLE blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  body TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);

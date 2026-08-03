import type { Env } from "@docracy/shared";

export interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  yesVotes: number;
  noVotes: number;
  /** This specific voter's own vote, or null if they haven't voted (or voterId is unknown) —
   *  omitted entirely from the admin listing, which has no voterId to check against. */
  myVote: "yes" | "no" | null;
}

interface FeatureRow {
  id: string;
  title: string;
  description: string;
  created_at: string;
  yes_votes: number;
  no_votes: number;
  my_vote: string | null;
}

function requireDb(env: Env) {
  if (!env.DOCRACY_DB) throw new Error("D1 is not configured on this deployment");
  return env.DOCRACY_DB;
}

function rowToFeature(row: FeatureRow): RoadmapFeature {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    yesVotes: row.yes_votes,
    noVotes: row.no_votes,
    myVote: row.my_vote === "yes" || row.my_vote === "no" ? row.my_vote : null,
  };
}

/** Every feature with aggregated vote counts, newest first. `voterId` (from the anonymous
 *  roadmap-voter cookie) is optional — pass it to also surface that voter's own vote per row;
 *  the admin listing omits it since there's no single "voter" to check against. */
export async function listRoadmapFeatures(env: Env, voterId?: string | null): Promise<RoadmapFeature[]> {
  if (!env.DOCRACY_DB) return [];
  const { results } = await env.DOCRACY_DB.prepare(
    `SELECT
       f.id, f.title, f.description, f.created_at,
       COALESCE(SUM(CASE WHEN v.vote = 'yes' THEN 1 ELSE 0 END), 0) AS yes_votes,
       COALESCE(SUM(CASE WHEN v.vote = 'no' THEN 1 ELSE 0 END), 0) AS no_votes,
       (SELECT vote FROM roadmap_votes WHERE feature_id = f.id AND voter_id = ?) AS my_vote
     FROM roadmap_features f
     LEFT JOIN roadmap_votes v ON v.feature_id = f.id
     GROUP BY f.id
     ORDER BY f.created_at DESC`
  )
    .bind(voterId ?? "")
    .all<FeatureRow>();
  return results.map(rowToFeature);
}

export async function createRoadmapFeature(
  env: Env,
  title: string,
  description: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!title.trim()) return { ok: false, error: "Title is required" };
  if (!description.trim()) return { ok: false, error: "Description is required" };

  const db = requireDb(env);
  const id = crypto.randomUUID();
  await db
    .prepare(`INSERT INTO roadmap_features (id, title, description, created_at) VALUES (?, ?, ?, ?)`)
    .bind(id, title.trim(), description.trim(), new Date().toISOString())
    .run();
  return { ok: true, id };
}

/** Deletes the feature and every vote cast on it — D1 doesn't reliably enforce ON DELETE CASCADE,
 *  so both deletes happen explicitly rather than leaving orphaned vote rows behind. */
export async function deleteRoadmapFeature(env: Env, id: string): Promise<void> {
  const db = requireDb(env);
  await db.prepare(`DELETE FROM roadmap_votes WHERE feature_id = ?`).bind(id).run();
  await db.prepare(`DELETE FROM roadmap_features WHERE id = ?`).bind(id).run();
}

/** Upsert — voting again just changes this voter's own prior vote for that feature, since
 *  (feature_id, voter_id) is the primary key. */
export async function castRoadmapVote(
  env: Env,
  featureId: string,
  voterId: string,
  vote: "yes" | "no"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = requireDb(env);
  const feature = await db.prepare(`SELECT id FROM roadmap_features WHERE id = ?`).bind(featureId).first();
  if (!feature) return { ok: false, error: "Feature not found" };

  await db
    .prepare(
      `INSERT INTO roadmap_votes (feature_id, voter_id, vote, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (feature_id, voter_id) DO UPDATE SET vote = excluded.vote, created_at = excluded.created_at`
    )
    .bind(featureId, voterId, vote, new Date().toISOString())
    .run();
  return { ok: true };
}

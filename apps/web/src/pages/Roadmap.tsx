import { useEffect, useState } from "react";
import { usePageMeta } from "../lib/usePageMeta";
import { fetchRoadmapFeatures, voteRoadmapFeature, type RoadmapFeature } from "../lib/api";
import { useNoIndex } from "../lib/useNoIndex";

function FeatureRow({ feature, onVoted }: { feature: RoadmapFeature; onVoted: (updated: RoadmapFeature) => void }) {
  const [voting, setVoting] = useState(false);
  const total = feature.yesVotes + feature.noVotes;
  const yesPct = total > 0 ? Math.round((feature.yesVotes / total) * 100) : null;

  const vote = async (choice: "yes" | "no") => {
    if (voting) return;
    setVoting(true);
    // Optimistic — the vote either replaces this voter's prior pick or adds a fresh one, so the
    // local count math mirrors exactly what castRoadmapVote does server-side.
    const already = feature.myVote;
    const next: RoadmapFeature = {
      ...feature,
      myVote: choice,
      yesVotes: feature.yesVotes + (choice === "yes" ? 1 : 0) - (already === "yes" ? 1 : 0),
      noVotes: feature.noVotes + (choice === "no" ? 1 : 0) - (already === "no" ? 1 : 0),
    };
    onVoted(next);
    try {
      await voteRoadmapFeature(feature.id, choice);
    } catch {
      onVoted(feature); // revert on failure
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 16 }}>{feature.title}</h3>
      <p style={{ marginTop: 0, marginBottom: 12, color: "var(--mute)", fontSize: 14 }}>{feature.description}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          className={feature.myVote === "yes" ? "btn-primary" : "btn-secondary"}
          disabled={voting}
          onClick={() => vote("yes")}
          style={{ fontSize: 13, padding: "6px 14px" }}
        >
          👍 Yes ({feature.yesVotes})
        </button>
        <button
          className={feature.myVote === "no" ? "btn-primary" : "btn-secondary"}
          disabled={voting}
          onClick={() => vote("no")}
          style={{ fontSize: 13, padding: "6px 14px" }}
        >
          👎 No ({feature.noVotes})
        </button>
        {yesPct !== null && (
          <span style={{ fontSize: 12, color: "var(--mute)" }}>
            {yesPct}% yes · {total} vote{total === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Roadmap() {
  useNoIndex();
  usePageMeta(
    "Roadmap — Docracy",
    "Vote yes or no on what Docracy should build next — no account needed. Real votes decide the next 12 months."
  );

  const [features, setFeatures] = useState<RoadmapFeature[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoadmapFeatures()
      .then((res) => setFeatures(res.features))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load the roadmap"));
  }, []);

  const updateFeature = (updated: RoadmapFeature) => {
    setFeatures((prev) => (prev ? prev.map((f) => (f.id === updated.id ? updated : f)) : prev));
  };

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>Roadmap</h1>
      <p style={{ color: "var(--mute)" }}>
        Vote yes or no on what we should build next — no account needed, same "no signup" philosophy as
        everything else here. Real votes decide what actually gets built over the next 12 months.
      </p>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {!features && !error && <p style={{ color: "var(--mute)" }}>Loading…</p>}
      {features && features.length === 0 && <p style={{ color: "var(--mute)" }}>Nothing on the roadmap yet — check back soon.</p>}
      {features?.map((f) => (
        <FeatureRow key={f.id} feature={f} onVoted={updateFeature} />
      ))}
    </div>
  );
}

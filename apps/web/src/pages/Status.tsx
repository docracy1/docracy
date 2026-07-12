import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchStatus } from "../lib/api";
import { useNoIndex } from "../lib/useNoIndex";
import type { StatusPayload } from "../lib/types";

export default function Status() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useNoIndex();

  useEffect(() => {
    if (!token) return;
    fetchStatus(token)
      .then(setStatus)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <div className="container">
        <h1>Not available</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="container">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>{status.status === "completed" ? "Fully signed" : "Signing in progress"}</h1>
      <div className="card">
        {[...status.signers]
          .sort((a, b) => a.order - b.order)
          .map((s) => (
            <div key={s.order} style={{ padding: "8px 0", borderBottom: "1px solid var(--hairline)" }}>
              {s.status === "signed" ? (
                <span style={{ color: "var(--success)" }}>
                  Signed by: {s.name} ✓ ({new Date(s.signedAt!).toLocaleDateString()})
                </span>
              ) : (
                <span style={{ color: "var(--body)" }}>Pending: {s.name}</span>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

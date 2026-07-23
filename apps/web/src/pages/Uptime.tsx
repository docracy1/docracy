import { useEffect, useState } from "react";
import { usePageMeta } from "../lib/usePageMeta";
import { apiUrl } from "../lib/api";

interface HealthCheckResult {
  name: string;
  ok: boolean;
  detail?: string;
}

interface DailyStatusRecord {
  date: string;
  ok: boolean;
  results: HealthCheckResult[];
}

interface StatusResponse {
  checkedAt: string;
  current: HealthCheckResult[];
  history: DailyStatusRecord[];
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: ok ? "var(--success)" : "var(--danger)",
      }}
    />
  );
}

function HistoryBar({ record }: { record: DailyStatusRecord | null }) {
  const title = record
    ? `${record.date} — ${record.ok ? "all systems operational" : "issue detected"}`
    : "No data";
  return (
    <div
      title={title}
      style={{
        flex: 1,
        height: 28,
        borderRadius: 3,
        background: !record ? "var(--hairline)" : record.ok ? "var(--success)" : "var(--danger)",
      }}
    />
  );
}

export default function Uptime() {
  usePageMeta(
    "System Status — Docracy",
    "Live status and uptime history for Docracy's signing, timestamping, billing, and MCP services."
  );

  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/status"))
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allOk = data?.current.every((r) => r.ok) ?? null;

  // Always render a fixed 90-day grid, oldest to newest, filling in gaps as "no data" — the
  // history array only contains days that were actually recorded, never a padded/fabricated past.
  const days: (DailyStatusRecord | null)[] = [];
  if (data) {
    const byDate = new Map(data.history.map((r) => [r.date, r]));
    for (let i = 89; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      days.push(byDate.get(d.toISOString().slice(0, 10)) ?? null);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>System Status</h1>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          Couldn't load status: {error}
        </div>
      )}

      {!data && !error && <p style={{ color: "var(--mute)" }}>Checking…</p>}

      {data && (
        <>
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <Dot ok={allOk ?? false} />
            <strong>{allOk ? "All systems operational" : "Some systems are experiencing issues"}</strong>
          </div>

          <h3>Current checks</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {data.current.map((check) => (
              <div key={check.name} className="card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Dot ok={check.ok} />
                <span style={{ flex: 1 }}>{check.name}</span>
                {!check.ok && check.detail && (
                  <span style={{ fontSize: 12, color: "var(--danger)" }}>{check.detail}</span>
                )}
              </div>
            ))}
          </div>

          <h3>Last 90 days</h3>
          <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
            {days.map((record, i) => (
              <HistoryBar key={i} record={record} />
            ))}
          </div>
          {data.history.length === 0 && (
            <p style={{ color: "var(--mute)", fontSize: 13 }}>
              History tracking just started — daily records will build up here over time.
            </p>
          )}

          <p style={{ color: "var(--mute)", fontSize: 12, marginTop: 24 }}>
            Last checked {new Date(data.checkedAt).toLocaleString()}. Checks run live on every page load, plus
            once daily for the history above.
          </p>
        </>
      )}
    </div>
  );
}

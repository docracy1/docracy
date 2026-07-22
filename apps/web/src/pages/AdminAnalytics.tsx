import { useEffect, useMemo, useState } from "react";
import { fetchAdminAnalytics, type FunnelRow } from "../lib/api";
import { usePageMeta } from "../lib/usePageMeta";

const HUMAN_COLOR = "#2f7ed8"; // var(--primary)
const BOT_COLOR = "#d9822b";

function sum(rows: FunnelRow[]): number {
  return rows.reduce((total, r) => total + r.count, 0);
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/** Two thin bars per day (human/bot page views), rounded tops, a 2px gap between the pair and
 *  between days, hover tooltip per bar — per the dataviz skill's mark/interaction specs. Kept as
 *  a small hand-built SVG rather than a charting library, matching this app's existing convention
 *  (see Landing.tsx's DocumentMockup) of hand-drawn SVG over a new dependency for one chart. */
function DailyViewsChart({ rows }: { rows: FunnelRow[] }) {
  const [hover, setHover] = useState<{ day: string; kind: string; count: number; x: number } | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, { human: number; bot: number }>();
    for (const r of rows) {
      if (r.event !== "page_view") continue;
      const entry = map.get(r.day) ?? { human: 0, bot: 0 };
      if (r.traffic_type === "bot") entry.bot += r.count;
      else entry.human += r.count;
      map.set(r.day, entry);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v }));
  }, [rows]);

  if (byDay.length === 0) {
    return <p style={{ color: "var(--mute)", fontSize: 13 }}>No page views recorded yet in this range.</p>;
  }

  const width = 700;
  const height = 200;
  const padding = { top: 10, bottom: 24, left: 10, right: 10 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const maxVal = Math.max(1, ...byDay.map((d) => Math.max(d.human, d.bot)));
  const groupW = plotW / byDay.length;
  const barW = Math.min(14, (groupW - 8) / 2);

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {byDay.map((d, i) => {
          const groupX = padding.left + i * groupW + groupW / 2;
          const humanH = (d.human / maxVal) * plotH;
          const botH = (d.bot / maxVal) * plotH;
          const baseY = padding.top + plotH;
          return (
            <g key={d.day}>
              <rect
                x={groupX - barW - 1}
                y={baseY - humanH}
                width={barW}
                height={Math.max(humanH, 1)}
                rx={3}
                fill={HUMAN_COLOR}
                onMouseEnter={() => setHover({ day: d.day, kind: "Human", count: d.human, x: groupX - barW })}
                onMouseLeave={() => setHover(null)}
              />
              <rect
                x={groupX + 1}
                y={baseY - botH}
                width={barW}
                height={Math.max(botH, 1)}
                rx={3}
                fill={BOT_COLOR}
                onMouseEnter={() => setHover({ day: d.day, kind: "Bot", count: d.bot, x: groupX + 1 })}
                onMouseLeave={() => setHover(null)}
              />
              {(i === 0 || i === byDay.length - 1 || byDay.length <= 10) && (
                <text x={groupX} y={height - 6} textAnchor="middle" fontSize="9" fill="var(--mute)">
                  {d.day.slice(5)}
                </text>
              )}
            </g>
          );
        })}
        <line
          x1={padding.left}
          y1={padding.top + plotH}
          x2={width - padding.right}
          y2={padding.top + plotH}
          stroke="var(--hairline)"
        />
      </svg>
      {hover && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${(hover.x / width) * 100}%`,
            transform: "translate(-50%, -100%)",
            background: "var(--ink)",
            color: "#fff",
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {hover.day} · {hover.kind}: {hover.count}
        </div>
      )}
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: HUMAN_COLOR, display: "inline-block" }} />
          Human
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: BOT_COLOR, display: "inline-block" }} />
          Bot
        </span>
      </div>
    </div>
  );
}

function RouteTable({ rows }: { rows: FunnelRow[] }) {
  const byRoute = useMemo(() => {
    const map = new Map<string, { total: number; human: number; bot: number }>();
    for (const r of rows) {
      if (r.event !== "page_view") continue;
      const entry = map.get(r.route) ?? { total: 0, human: 0, bot: 0 };
      entry.total += r.count;
      if (r.traffic_type === "bot") entry.bot += r.count;
      else entry.human += r.count;
      map.set(r.route, entry);
    }
    return [...map.entries()].sort(([, a], [, b]) => b.total - a.total);
  }, [rows]);

  if (byRoute.length === 0) return <p style={{ color: "var(--mute)", fontSize: 13 }}>No page views yet.</p>;

  return (
    <div className="plan-table-scroll">
      <table className="plan-table" style={{ minWidth: 360 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Route</th>
            <th>Total</th>
            <th>Human</th>
            <th>Bot</th>
          </tr>
        </thead>
        <tbody>
          {byRoute.map(([route, v]) => (
            <tr key={route}>
              <td style={{ textAlign: "left" }}>{route}</td>
              <td>{v.total}</td>
              <td>{v.human}</td>
              <td>{v.bot}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BotTable({ rows }: { rows: FunnelRow[] }) {
  const byBot = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.event !== "page_view" || r.traffic_type !== "bot" || !r.bot_name) continue;
      map.set(r.bot_name, (map.get(r.bot_name) ?? 0) + r.count);
    }
    return [...map.entries()].sort(([, a], [, b]) => b - a);
  }, [rows]);

  if (byBot.length === 0) return <p style={{ color: "var(--mute)", fontSize: 13 }}>No known bot traffic yet.</p>;

  return (
    <div className="plan-table-scroll">
      <table className="plan-table" style={{ minWidth: 280 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Bot</th>
            <th>Page views</th>
          </tr>
        </thead>
        <tbody>
          {byBot.map(([name, count]) => (
            <tr key={name}>
              <td style={{ textAlign: "left" }}>{name}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminAnalytics() {
  usePageMeta("Analytics — Docracy", "Internal traffic and funnel analytics.");

  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<FunnelRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminAnalytics(days)
      .then((res) => {
        if (!cancelled) setRows(res.rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load analytics");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const totals = useMemo(() => {
    if (!rows) return null;
    const pageViews = rows.filter((r) => r.event === "page_view");
    const created = sum(rows.filter((r) => r.event === "document_created"));
    const completed = sum(rows.filter((r) => r.event === "document_completed"));
    const totalViews = sum(pageViews);
    const botViews = sum(pageViews.filter((r) => r.traffic_type === "bot"));
    return {
      totalViews,
      botPct: totalViews > 0 ? Math.round((botViews / totalViews) * 100) : 0,
      created,
      completed,
      completionRate: created > 0 ? Math.round((completed / created) * 100) : null,
    };
  }, [rows]);

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 26 }}>Analytics</h1>
      <p style={{ color: "var(--mute)", marginTop: -8, marginBottom: 20 }}>
        Aggregate traffic and funnel counts — no per-visitor tracking, no IPs or cookies stored.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            className={d === days ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: 13, padding: "6px 14px" }}
            onClick={() => setDays(d)}
          >
            Last {d}d
          </button>
        ))}
      </div>

      {loading && <p style={{ color: "var(--mute)" }}>Loading…</p>}
      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {!loading && !error && rows && totals && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
            <StatTile label="Page views" value={String(totals.totalViews)} sub={`${totals.botPct}% known bots`} />
            <StatTile label="Documents created" value={String(totals.created)} />
            <StatTile label="Documents completed" value={String(totals.completed)} />
            <StatTile
              label="Created → completed"
              value={totals.completionRate === null ? "—" : `${totals.completionRate}%`}
            />
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginTop: 0, fontSize: 15 }}>Page views by day</h3>
            <DailyViewsChart rows={rows} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: 15 }}>By route</h3>
              <RouteTable rows={rows} />
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: 15 }}>By bot</h3>
              <BotTable rows={rows} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

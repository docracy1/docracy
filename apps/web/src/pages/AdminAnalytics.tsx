import { useEffect, useMemo, useState } from "react";
import {
  approveMarketplaceSubmission,
  createBlogPost,
  createRoadmapFeature,
  deleteBlogPost,
  deleteRoadmapFeature,
  fetchAdminAccounts,
  fetchAdminAnalytics,
  fetchAdminBlogPost,
  fetchAdminBlogPosts,
  fetchAdminDocuments,
  fetchAdminEnterpriseAccounts,
  fetchAdminMarketplacePending,
  fetchAdminMarketplacePreview,
  fetchAdminRoadmapFeatures,
  fetchMarketingRecipientsCount,
  grantEnterprise,
  rejectMarketplaceSubmission,
  sendMarketingEmail,
  setAnalyticsNoTrack,
  updateBlogPost,
  type AdminAccount,
  type AdminDocumentRow,
  type AdminEnterpriseAccount,
  type DynamicBlogPostSummary,
  type MarketplaceSubmission,
  type RoadmapFeature,
  type FunnelRow,
  type FunnelStepRow,
  type AttributionRow,
  type TrafficSourceRow,
} from "../lib/api";
import { base64ToBytes } from "../lib/base64";
import { usePageMeta } from "../lib/usePageMeta";

const HUMAN_COLOR = "#2f7ed8"; // var(--primary)
const BOT_COLOR = "#d9822b";

function sum(rows: FunnelRow[]): number {
  return rows.reduce((total, r) => total + r.count, 0);
}

interface FunnelStepDef {
  event: string;
  label: string;
}

// Literal event order per category, matching the spec exactly. Activation and Template funnels use
// totalCount (raw event counts) since their steps aren't inflated by anything. Completion uses
// distinctDocuments instead: document_viewed/document_signed both fire once per signer, so a raw
// count overcounts any multi-signer chain — COUNT(DISTINCT documentId) fixes that. The two
// "_after_" timeout events and template_abandoned are outcomes, not forward funnel progress, so
// they're pulled out as side stats rather than fake sequential steps.
const ACTIVATION_STEPS: FunnelStepDef[] = [
  { event: "signup_started", label: "Signup started" },
  { event: "signup_completed", label: "Signup completed" },
  { event: "dashboard_loaded", label: "Dashboard loaded" },
  { event: "document_upload_started", label: "Upload started" },
  { event: "document_uploaded", label: "Document uploaded" },
  { event: "template_opened", label: "Template opened" },
  { event: "template_used", label: "Template used" },
  { event: "fields_added", label: "Fields added" },
  { event: "document_sent", label: "Document sent" },
];

const COMPLETION_STEPS: FunnelStepDef[] = [
  { event: "document_sent", label: "Document sent" },
  { event: "document_viewed", label: "Document viewed" },
  { event: "document_signed", label: "Signed" },
  { event: "document_downloaded", label: "Downloaded" },
];
const COMPLETION_SIDE_STATS: FunnelStepDef[] = [
  { event: "document_not_opened_after_2h", label: "Stalled — not opened after 2h" },
  { event: "document_not_signed_after_4h", label: "Stalled — viewed but not signed after 4h" },
];

const TEMPLATE_STEPS: FunnelStepDef[] = [
  { event: "template_category_viewed", label: "Category viewed" },
  { event: "template_preview_opened", label: "Preview opened" },
  { event: "template_started", label: "Started" },
  { event: "template_completed", label: "Completed" },
];
const TEMPLATE_SIDE_STATS: FunnelStepDef[] = [{ event: "template_abandoned", label: "Abandoned" }];

const TRAFFIC_STEPS: FunnelStepDef[] = [
  { event: "landingpage_loaded", label: "Landing page loaded" },
  { event: "landingpage_cta_clicked", label: "Landing page CTA clicked" },
  { event: "referral_source_detected", label: "Referral source detected" },
  { event: "blog_article_loaded", label: "Blog article loaded" },
  { event: "blog_cta_clicked", label: "Blog CTA clicked" },
  { event: "page_view", label: "Page viewed" },
  { event: "page_view_js", label: "— confirmed by JS (real browser)" },
];

/** The single "north star" event for a funnel — called out with a badge in the card header and
 *  bolded/accent-colored in its own row, same convention as Chasa's admin analytics (a sibling
 *  product built on this same pattern) so an admin skimming multiple funnels always knows which
 *  row is the one number that matters most. */
function FunnelCard({
  title,
  note,
  steps,
  sideStats,
  countKey,
  stepsByEvent,
  kpiEvent,
}: {
  title: string;
  note?: string;
  steps: FunnelStepDef[];
  sideStats?: FunnelStepDef[];
  countKey: "totalCount" | "distinctDocuments";
  stepsByEvent: Map<string, FunnelStepRow>;
  kpiEvent?: string;
}) {
  const counts = steps.map((s) => stepsByEvent.get(s.event)?.[countKey] ?? 0);
  const maxCount = Math.max(1, ...counts);

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <h3 style={{ marginTop: 0, fontSize: 15 }}>{title}</h3>
        {kpiEvent && (
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.03em", color: HUMAN_COLOR, whiteSpace: "nowrap" }}>
            KPI · {kpiEvent.toUpperCase()}
          </span>
        )}
      </div>
      {note && <p style={{ fontSize: 12, color: "var(--mute)", marginTop: -4 }}>{note}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((s, i) => {
          const count = counts[i];
          const pctOfMax = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const convFromPrev = i === 0 || counts[i - 1] <= 0 ? null : Math.round((count / counts[i - 1]) * 100);
          const isKpi = s.event === kpiEvent;
          return (
            <div key={s.event}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 3,
                  color: isKpi ? HUMAN_COLOR : undefined,
                  fontWeight: isKpi ? 700 : undefined,
                }}
              >
                <span>{s.label}</span>
                <span>
                  <strong>{count}</strong>
                  {convFromPrev !== null && <span style={{ color: "var(--mute)", marginLeft: 8, fontWeight: 400 }}>{convFromPrev}% of previous</span>}
                </span>
              </div>
              <div style={{ background: "var(--hairline)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                <div style={{ width: `${pctOfMax}%`, background: HUMAN_COLOR, height: "100%", borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>
      {sideStats && sideStats.length > 0 && (
        <div style={{ display: "flex", gap: 16, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--hairline)", flexWrap: "wrap" }}>
          {sideStats.map((s) => (
            <div key={s.event} style={{ fontSize: 12, color: "var(--mute)" }}>
              {s.label}: <strong style={{ color: "var(--body)" }}>{stepsByEvent.get(s.event)?.totalCount ?? 0}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  onClick,
  active,
}: {
  label: string;
  value: string;
  sub?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const interactive = Boolean(onClick);
  return (
    <div
      className="card"
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      style={{
        padding: 16,
        cursor: interactive ? "pointer" : undefined,
        outline: active ? "2px solid var(--primary)" : undefined,
        outlineOffset: active ? 2 : undefined,
      }}
    >
      <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 2 }}>{sub}</div>}
      {interactive && (
        <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 6, fontWeight: 600 }}>
          {active ? "Hide emails ↑" : "Show emails →"}
        </div>
      )}
    </div>
  );
}

function DocumentsDrilldownCard({ days, kind }: { days: number; kind: "sent" | "signed" }) {
  const [docs, setDocs] = useState<AdminDocumentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminDocuments(days, kind)
      .then((res) => {
        if (!cancelled) setDocs(res.documents);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load documents");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days, kind]);

  const title = kind === "signed" ? "Documents signed — emails" : "Documents sent — emails";

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 4, fontSize: 15 }}>
        {title}
        {docs ? ` (${docs.length})` : ""}
      </h3>
      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 0, marginBottom: 12 }}>
        Account-linked documents only (anonymous free sends never hit the database index). Sender is the
        workspace email; signers are listed under each document.
      </p>
      {loading && <p style={{ color: "var(--mute)", fontSize: 13 }}>Loading…</p>}
      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
      {!loading && !error && docs && docs.length === 0 && (
        <p style={{ color: "var(--mute)", fontSize: 13, marginBottom: 0 }}>
          No account-linked documents in this range.
        </p>
      )}
      {!loading &&
        !error &&
        docs?.map((doc) => (
          <div
            key={doc.docId}
            style={{
              padding: "10px 0",
              borderBottom: "1px solid var(--hairline)",
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
              <strong style={{ overflowWrap: "anywhere" }}>{doc.title || doc.docId}</strong>
              <span style={{ color: "var(--mute)", fontSize: 12 }}>
                {kind === "signed" && doc.completedAt
                  ? new Date(doc.completedAt).toLocaleDateString()
                  : new Date(doc.createdAt).toLocaleDateString()}{" "}
                · {doc.status}
              </span>
            </div>
            <div style={{ marginTop: 4 }}>
              Sender: <a href={`mailto:${doc.accountEmail}`}>{doc.accountEmail}</a>
            </div>
            {doc.signers.length > 0 && (
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "var(--body)" }}>
                {doc.signers.map((s, i) => (
                  <li key={`${doc.docId}-${i}`}>
                    <a href={`mailto:${s.email}`}>{s.email}</a>
                    {s.name ? ` (${s.name})` : ""}
                    {s.status === "signed" && s.signedAt
                      ? ` — signed ${new Date(s.signedAt).toLocaleDateString()}`
                      : ` — ${s.status}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
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

/** Shared by RouteTable/BotTable/CountryTable — the distinct page_view days present in `rows`,
 *  most recent first, so each table's day dropdown offers the same options. */
function usePageViewDays(rows: FunnelRow[]): string[] {
  return useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.event === "page_view") set.add(r.day);
    }
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [rows]);
}

function DayFilterSelect({
  days,
  selectedDay,
  onChange,
}: {
  days: string[];
  selectedDay: string;
  onChange: (day: string) => void;
}) {
  return (
    <select
      className="form-input"
      aria-label="Filter by day"
      value={selectedDay}
      onChange={(e) => onChange(e.target.value)}
      style={{ fontSize: 13, padding: "4px 8px", marginBottom: 10, width: "auto" }}
    >
      <option value="all">All days</option>
      {days.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>
  );
}

function RouteTable({ rows }: { rows: FunnelRow[] }) {
  const days = usePageViewDays(rows);
  const [selectedDay, setSelectedDay] = useState("all");

  const byRoute = useMemo(() => {
    const map = new Map<string, { total: number; human: number; bot: number }>();
    for (const r of rows) {
      if (r.event !== "page_view") continue;
      if (selectedDay !== "all" && r.day !== selectedDay) continue;
      const entry = map.get(r.route) ?? { total: 0, human: 0, bot: 0 };
      entry.total += r.count;
      if (r.traffic_type === "bot") entry.bot += r.count;
      else entry.human += r.count;
      map.set(r.route, entry);
    }
    return [...map.entries()].sort(([, a], [, b]) => b.total - a.total);
  }, [rows, selectedDay]);

  return (
    <>
      <DayFilterSelect days={days} selectedDay={selectedDay} onChange={setSelectedDay} />
      {byRoute.length === 0 ? (
        <p style={{ color: "var(--mute)", fontSize: 13 }}>No page views for this range.</p>
      ) : (
        <div className="plan-table-scroll" style={{ overflowX: "auto" }}>
          <table className="plan-table plan-table-static" style={{ width: "100%", minWidth: "auto", tableLayout: "fixed" }}>
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
                  <td style={{ textAlign: "left", overflowWrap: "anywhere" }}>{route}</td>
                  <td>{v.total}</td>
                  <td>{v.human}</td>
                  <td>{v.bot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function BotTable({ rows }: { rows: FunnelRow[] }) {
  const days = usePageViewDays(rows);
  const [selectedDay, setSelectedDay] = useState("all");

  const byBot = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.event !== "page_view" || r.traffic_type !== "bot" || !r.bot_name) continue;
      if (selectedDay !== "all" && r.day !== selectedDay) continue;
      map.set(r.bot_name, (map.get(r.bot_name) ?? 0) + r.count);
    }
    return [...map.entries()].sort(([, a], [, b]) => b - a);
  }, [rows, selectedDay]);

  return (
    <>
      <DayFilterSelect days={days} selectedDay={selectedDay} onChange={setSelectedDay} />
      {byBot.length === 0 ? (
        <p style={{ color: "var(--mute)", fontSize: 13 }}>No known bot traffic for this range.</p>
      ) : (
        <div className="plan-table-scroll" style={{ overflowX: "auto" }}>
          <table className="plan-table plan-table-static" style={{ width: "100%", minWidth: "auto", tableLayout: "fixed" }}>
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
      )}
    </>
  );
}

function CountryTable({ rows }: { rows: FunnelRow[] }) {
  const days = usePageViewDays(rows);
  const [selectedDay, setSelectedDay] = useState("all");

  const byCountry = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.event !== "page_view" || !r.country) continue;
      if (selectedDay !== "all" && r.day !== selectedDay) continue;
      map.set(r.country, (map.get(r.country) ?? 0) + r.count);
    }
    return [...map.entries()].sort(([, a], [, b]) => b - a);
  }, [rows, selectedDay]);

  return (
    <>
      <DayFilterSelect days={days} selectedDay={selectedDay} onChange={setSelectedDay} />
      {byCountry.length === 0 ? (
        <p style={{ color: "var(--mute)", fontSize: 13 }}>No country data for this range.</p>
      ) : (
        <div className="plan-table-scroll" style={{ overflowX: "auto" }}>
          <table className="plan-table plan-table-static" style={{ width: "100%", minWidth: "auto", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Country</th>
                <th>Page views</th>
              </tr>
            </thead>
            <tbody>
              {byCountry.map(([country, count]) => (
                <tr key={country}>
                  <td style={{ textAlign: "left" }}>{country}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const EMPTY_BLOG_FORM = { id: null as string | null, title: "", slug: "", description: "", body: "", publish: false };

/** Self-serve blog publishing — create/edit/publish/delete posts without a code deploy. Merged
 *  on the public /blog page alongside the 4 hand-coded competitor-comparison articles (see
 *  apps/web/src/lib/blog.ts), which this card never touches. */
function BlogPostsCard() {
  const [posts, setPosts] = useState<DynamicBlogPostSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_BLOG_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = () =>
    fetchAdminBlogPosts()
      .then((res) => setPosts(res.posts))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load posts"));

  useEffect(() => {
    refresh();
  }, []);

  const onEdit = async (id: string) => {
    setSaveError(null);
    try {
      const { post } = await fetchAdminBlogPost(id);
      setForm({ id: post.id, title: post.title, slug: post.slug, description: post.description, body: post.body, publish: !!post.publishedAt });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to load post");
    }
  };

  const onDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteBlogPost(id);
      if (form.id === id) setForm(EMPTY_BLOG_FORM);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setBusyId(null);
    }
  };

  const onTogglePublish = async (post: DynamicBlogPostSummary) => {
    setBusyId(post.id);
    try {
      await updateBlogPost(post.id, { publish: !post.publishedAt });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setBusyId(null);
    }
  };

  const onSave = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (form.id) {
        await updateBlogPost(form.id, {
          title: form.title,
          description: form.description,
          body: form.body,
          publish: form.publish,
        });
      } else {
        await createBlogPost({
          title: form.title,
          slug: form.slug.trim() || undefined,
          description: form.description,
          body: form.body,
          publish: form.publish,
        });
      }
      setForm(EMPTY_BLOG_FORM);
      await refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ marginTop: 0, fontSize: 15 }}>Blog posts</h3>
      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: -4 }}>
        Publish articles yourself — no code deploy needed. New posts appear on /blog as soon as
        you publish them.
      </p>

      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
      {posts && posts.length === 0 && <p style={{ fontSize: 13, color: "var(--mute)" }}>No posts yet — write your first one below.</p>}
      {posts && posts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {posts.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                borderBottom: "1px solid var(--hairline)",
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, overflowWrap: "anywhere" }}>{p.title}</div>
                <div style={{ fontSize: 11, color: "var(--mute)" }}>
                  /blog/{p.slug} · {p.publishedAt ? "Published" : "Draft"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 8px" }} onClick={() => onEdit(p.id)}>
                  Edit
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 12, padding: "4px 8px" }}
                  disabled={busyId === p.id}
                  onClick={() => onTogglePublish(p)}
                >
                  {p.publishedAt ? "Unpublish" : "Publish"}
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 12, padding: "4px 8px", color: "var(--danger)" }}
                  disabled={busyId === p.id}
                  onClick={() => onDelete(p.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h4 style={{ fontSize: 13, marginBottom: 8 }}>{form.id ? "Edit post" : "New post"}</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560 }}>
        <input
          className="form-input"
          placeholder="Title"
          aria-label="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        {!form.id && (
          <input
            className="form-input"
            placeholder="Slug (optional — derived from title if left blank)"
            aria-label="Slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
        )}
        <input
          className="form-input"
          placeholder="Short description (shown on the blog index and in search results)"
          aria-label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <textarea
          className="form-input"
          placeholder="Body — separate paragraphs with a blank line"
          aria-label="Body"
          rows={10}
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          style={{ fontFamily: "inherit", resize: "vertical" }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={form.publish} onChange={(e) => setForm((f) => ({ ...f, publish: e.target.checked }))} />
          Published (visible on /blog)
        </label>
        {saveError && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{saveError}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" disabled={saving || !form.title.trim() || !form.body.trim()} onClick={onSave}>
            {saving ? "Saving…" : form.id ? "Save changes" : "Create post"}
          </button>
          {form.id && (
            <button className="btn-secondary" onClick={() => setForm(EMPTY_BLOG_FORM)}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const CATEGORY_COLOR: Record<string, string> = {
  // Docracy's own lawyer-reviewed templates use the main brand color; community submissions use
  // the existing accent teal — same distinction shown to visitors on /free-templates.
  docracy: "#2f7ed8", // var(--primary)
  community: "#00c898", // close to var(--accent), tuned down for readable text-on-white
};

function MarketplaceReviewCard() {
  const [pending, setPending] = useState<MarketplaceSubmission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({});

  const refresh = () =>
    fetchAdminMarketplacePending()
      .then((res) => setPending(res.pending))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load submissions"));

  useEffect(() => {
    refresh();
  }, []);

  const onPreview = async (id: string) => {
    try {
      const { pdfBase64 } = await fetchAdminMarketplacePreview(id);
      const bytes = base64ToBytes(pdfBase64);
      const blob = new Blob([bytes.slice()], { type: "application/pdf" });
      window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF");
    }
  };

  const onApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveMarketplaceSubmission(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (id: string) => {
    setBusyId(id);
    try {
      await rejectMarketplaceSubmission(id, rejectReasonById[id]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ marginTop: 0, fontSize: 15 }}>Marketplace submissions</h3>
      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: -4 }}>
        Review every submission's PDF before approving — check for real names, addresses, or
        company details typed into the body text, not just the field placeholders. Approved
        templates appear on /free-templates tagged "Community"; Docracy's own templates there
        stay tagged separately.
      </p>

      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
      {pending && pending.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--mute)" }}>Nothing waiting on review.</p>
      )}
      {pending?.map((sub) => (
        <div key={sub.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--hairline)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, overflowWrap: "anywhere" }}>
                {sub.title}{" "}
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 999,
                    background: CATEGORY_COLOR.community,
                    color: "#fff",
                  }}
                >
                  Community
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--mute)" }}>
                {sub.category ?? "Uncategorized"} · {sub.signerCount} signer(s), {sub.pageCount} page(s) · submitted{" "}
                {new Date(sub.submittedAt).toLocaleDateString()}
              </div>
              {sub.description && <div style={{ fontSize: 12, marginTop: 4 }}>{sub.description}</div>}
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "flex-start" }}>
              <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 8px" }} onClick={() => onPreview(sub.id)}>
                Preview PDF
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: 12, padding: "4px 8px" }}
                disabled={busyId === sub.id}
                onClick={() => onApprove(sub.id)}
              >
                Approve
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: 12, padding: "4px 8px" }}
                disabled={busyId === sub.id}
                onClick={() => onReject(sub.id)}
              >
                Reject
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Rejection reason (optional, kept for the submitter's record)"
            value={rejectReasonById[sub.id] ?? ""}
            onChange={(e) => setRejectReasonById((prev) => ({ ...prev, [sub.id]: e.target.value }))}
            style={{ fontSize: 12, marginTop: 6, width: "100%", maxWidth: 480 }}
          />
        </div>
      ))}
    </div>
  );
}

const EMPTY_ROADMAP_FORM = { title: "", description: "" };

/** Add/delete only, deliberately no edit — the public vote a feature already accumulated stays
 *  attached to its title, so changing the pitch after people voted would misrepresent what they
 *  actually voted on. Delete and re-add fresh if a pitch needs to change. */
function RoadmapCard() {
  const [features, setFeatures] = useState<RoadmapFeature[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_ROADMAP_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = () =>
    fetchAdminRoadmapFeatures()
      .then((res) => setFeatures(res.features))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load the roadmap"));

  useEffect(() => {
    refresh();
  }, []);

  const onDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteRoadmapFeature(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete feature");
    } finally {
      setBusyId(null);
    }
  };

  const onAdd = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createRoadmapFeature({ title: form.title, description: form.description });
      setForm(EMPTY_ROADMAP_FORM);
      await refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ marginTop: 0, fontSize: 15 }}>Roadmap</h3>
      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: -4 }}>
        Public at /roadmap — anyone can vote yes/no, no account needed. Add or remove items here.
      </p>

      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
      {features && features.length === 0 && <p style={{ fontSize: 13, color: "var(--mute)" }}>Nothing on the roadmap yet.</p>}
      {features && features.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {features.map((f) => (
            <div
              key={f.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                borderBottom: "1px solid var(--hairline)",
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, overflowWrap: "anywhere" }}>{f.title}</div>
                <div style={{ fontSize: 11, color: "var(--mute)" }}>
                  {f.yesVotes} yes · {f.noVotes} no
                </div>
              </div>
              <button
                className="btn-secondary"
                style={{ fontSize: 12, padding: "4px 8px", color: "var(--danger)", flexShrink: 0 }}
                disabled={busyId === f.id}
                onClick={() => onDelete(f.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <h4 style={{ fontSize: 13, marginBottom: 8 }}>Add feature</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560 }}>
        <input
          className="form-input"
          placeholder="Title"
          aria-label="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <textarea
          className="form-input"
          placeholder="Short description — shown under the title on /roadmap"
          aria-label="Description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          style={{ fontFamily: "inherit", resize: "vertical" }}
        />
        {saveError && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{saveError}</p>}
        <button className="btn-primary" disabled={saving || !form.title.trim() || !form.description.trim()} onClick={onAdd}>
          {saving ? "Adding…" : "Add to roadmap"}
        </button>
      </div>
    </div>
  );
}

/** Where you (not the customer) see enterprise accounts and how soon each expires — a customer
 *  only ever sees their own, in their own Dashboard's Subscription panel. */
function EnterpriseAccountsCard() {
  const [accounts, setAccounts] = useState<AdminEnterpriseAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [grantEmail, setGrantEmail] = useState("");
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);

  const refresh = () =>
    fetchAdminEnterpriseAccounts()
      .then((res) => setAccounts(res.accounts))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load enterprise accounts"));

  useEffect(() => {
    refresh();
  }, []);

  const onGrant = async () => {
    if (!grantEmail.trim()) return;
    setGranting(true);
    setGrantError(null);
    setGrantSuccess(null);
    try {
      await grantEnterprise(grantEmail.trim());
      setGrantSuccess(`Granted Enterprise to ${grantEmail.trim()}`);
      setGrantEmail("");
      await refresh();
    } catch (err) {
      setGrantError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ marginTop: 0, fontSize: 15 }}>Enterprise accounts</h3>
      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: -4 }}>
        Self-serve customers subscribe via the Dashboard (a real recurring annual Stripe
        subscription — renewal and cancellation both flow through Stripe automatically). For bank
        transfers or custom Payment Links, grant Enterprise manually here once you've confirmed
        payment.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="customer@example.com"
          aria-label="Customer email"
          value={grantEmail}
          onChange={(e) => setGrantEmail(e.target.value)}
        />
        <button className="btn-secondary" disabled={granting || !grantEmail.trim()} onClick={onGrant}>
          {granting ? "Granting…" : "Grant Enterprise"}
        </button>
      </div>
      {grantError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{grantError}</p>}
      {grantSuccess && <p style={{ color: "var(--success)", fontSize: 13 }}>{grantSuccess}</p>}

      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
      {!error && accounts && accounts.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--mute)", marginBottom: 0 }}>No enterprise accounts yet.</p>
      )}
      {!error && accounts && accounts.length > 0 && (
        <div className="plan-table-scroll">
          <table className="plan-table plan-table-static" style={{ minWidth: 360 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.email}>
                  <td style={{ textAlign: "left" }}>{a.email}</td>
                  <td style={{ color: a.isPaid ? "var(--success)" : "var(--danger)" }}>
                    {a.isPaid ? "Active" : "Lapsed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Composes and sends the opted-in product-news broadcast (accounts.marketing_opt_in +
 *  non-unsubscribed onboarding_leads — see lib/marketingEmail.ts on the worker). Real emails to
 *  real people, so sending requires clicking "Send" twice — the button relabels itself into an
 *  explicit confirmation rather than firing on the first click. */
function MarketingEmailCard() {
  const [count, setCount] = useState<number | null>(null);
  const [countError, setCountError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  const refreshCount = () =>
    fetchMarketingRecipientsCount()
      .then((res) => setCount(res.count))
      .catch((err) => setCountError(err instanceof Error ? err.message : "Failed to load recipient count"));

  useEffect(() => {
    refreshCount();
  }, []);

  const onSendClick = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setSending(true);
    setSendError(null);
    setSendResult(null);
    try {
      const result = await sendMarketingEmail(subject.trim(), body.trim());
      setSendResult(result);
      setSubject("");
      setBody("");
      await refreshCount();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
      setConfirming(false);
    }
  };

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && !sending;

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ marginTop: 0, fontSize: 15 }}>Marketing email</h3>
      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: -4 }}>
        Sends to accounts that opted in under Dashboard &rarr; Subscription, plus leads who haven't
        unsubscribed. Every send gets a one-click unsubscribe footer automatically.{" "}
        {countError ? (
          <span style={{ color: "var(--danger)" }}>{countError}</span>
        ) : (
          <strong>{count === null ? "Loading recipients…" : `${count} recipient${count === 1 ? "" : "s"}`}</strong>
        )}
      </p>

      <input
        className="form-input"
        style={{ marginBottom: 8 }}
        placeholder="Subject"
        aria-label="Subject"
        value={subject}
        onChange={(e) => {
          setSubject(e.target.value);
          setConfirming(false);
        }}
      />
      <textarea
        className="form-input"
        style={{ marginBottom: 8, minHeight: 160, fontFamily: "monospace", fontSize: 13 }}
        placeholder="HTML body — sent as-is inside the standard Docracy email shell."
        aria-label="Body (HTML)"
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setConfirming(false);
        }}
      />

      <button className={confirming ? "btn-primary" : "btn-secondary"} disabled={!canSend} onClick={onSendClick}>
        {sending
          ? "Sending…"
          : confirming
            ? `Confirm: send to ${count ?? "?"} recipient${count === 1 ? "" : "s"}`
            : "Send"}
      </button>
      {confirming && !sending && (
        <button className="btn-secondary" style={{ marginLeft: 8 }} onClick={() => setConfirming(false)}>
          Cancel
        </button>
      )}

      {sendError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{sendError}</p>}
      {sendResult && (
        <p style={{ color: "var(--success)", fontSize: 13 }}>
          Sent {sendResult.sent}
          {sendResult.failed > 0 ? `, ${sendResult.failed} failed` : ""}.
        </p>
      )}
    </div>
  );
}

/** Every signup, paid or not — a customer only ever sees their own account. Email is the only
 *  identity Docracy collects at signup (magic-link auth, no separate name field). */
/** A plain (non-`.plan-table`) scrollable list — `.plan-table`'s thead uses `position: sticky;
 *  top: 72px` tuned for sticking to the *page's* scroll under the fixed nav bar; nesting it
 *  inside this card's own `overflow-y: auto` box made it stick 72px into a much shorter box
 *  instead, floating the header over the rows. */
function AccountMiniList({ title, accounts }: { title: string; accounts: AdminAccount[] }) {
  return (
    <div>
      <h4 style={{ fontSize: 13, color: "var(--mute)", marginTop: 0, marginBottom: 8 }}>
        {title} ({accounts.length})
      </h4>
      {accounts.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--mute)" }}>None yet.</p>
      ) : (
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {accounts.map((a) => (
            <div
              key={a.email}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                padding: "8px 0",
                borderBottom: "1px solid var(--hairline)",
                fontSize: 13.5,
              }}
            >
              <span style={{ overflowWrap: "anywhere" }}>{a.email}</span>
              <span style={{ color: "var(--mute)", flexShrink: 0 }}>{new Date(a.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AllAccountsCard() {
  const [accounts, setAccounts] = useState<AdminAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchAdminAccounts()
      .then((res) => setAccounts(res.accounts))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load accounts"));
  }, []);

  const free = accounts?.filter((a) => !a.isPaid) ?? [];
  const paid = accounts?.filter((a) => a.isPaid) ?? [];

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 4, fontSize: 15 }}>All signups ({accounts?.length ?? "…"})</h3>
          <p style={{ fontSize: 12, color: "var(--mute)", margin: 0 }}>
            Every account, including free signups that never pay. Docracy's magic-link sign-in only
            collects an email address — there's no separate name field to show.
          </p>
        </div>
        {accounts && accounts.length > 0 && (
          <button className="btn-secondary" style={{ fontSize: 13, padding: "4px 10px", flexShrink: 0 }} onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Split by plan" : "Show all"}
          </button>
        )}
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
      {!error && accounts && accounts.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--mute)", marginBottom: 0 }}>No signups yet.</p>
      )}
      {!error && accounts && accounts.length > 0 && !showAll && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginTop: 16 }}>
          <AccountMiniList title="Free" accounts={free} />
          <AccountMiniList title="Paid" accounts={paid} />
        </div>
      )}
      {!error && accounts && accounts.length > 0 && showAll && (
        <div style={{ maxHeight: 400, overflowY: "auto", marginTop: 16 }}>
          {accounts.map((a) => (
            <div
              key={a.email}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                padding: "8px 0",
                borderBottom: "1px solid var(--hairline)",
                fontSize: 13.5,
              }}
            >
              <span style={{ overflowWrap: "anywhere" }}>{a.email}</span>
              <span style={{ color: "var(--mute)", flexShrink: 0 }}>{new Date(a.createdAt).toLocaleDateString()}</span>
              <span style={{ flexShrink: 0, minWidth: 70, textAlign: "right" }}>
                {a.isEnterprise ? "Enterprise" : a.isPaid ? "Paid" : "Free"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const EMAIL_STEPS: FunnelStepDef[] = [
  { event: "email_sent", label: "Sent" },
  { event: "email_opened", label: "Opened" },
  { event: "email_clicked", label: "Clicked" },
];

const REVENUE_STEPS: FunnelStepDef[] = [
  { event: "upgrade_clicked", label: "Upgrade clicked" },
  { event: "checkout_started", label: "Checkout started" },
  { event: "checkout_completed", label: "Checkout completed" },
];

function AttributionTable({ rows }: { rows: AttributionRow[] }) {
  if (rows.length === 0) {
    return <p style={{ color: "var(--mute)", fontSize: 13 }}>No attributed growth events in this window yet.</p>;
  }
  return (
    <table className="plan-table plan-table-static" style={{ width: "100%" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left" }}>Event</th>
          <th style={{ textAlign: "left" }}>Channel</th>
          <th style={{ textAlign: "right" }}>Count</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={`${r.event}:${r.attribution}`}>
            <td>{r.event}</td>
            <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{r.attribution}</td>
            <td style={{ textAlign: "right" }}>{r.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Any hostname that's just docracy itself under a different name/port — the server-side filter
 *  in routes/analytics.ts only excludes an exact match against the current request's own
 *  hostname, so a visit to www.docracy.io with a docracy.io referrer (or vice versa) still slips
 *  through as if it were external, and so do the odd port-suffixed variants (docracy.io:8080 etc.)
 *  that showed up in a raw data pull — almost certainly scanners re-sending our own hostname as
 *  their spoofed Referer, not real navigation. */
const SELF_HOST_RE = /docracy/i;

/** Known referrer hostnames → a human label. Falls back to the bare hostname (www. stripped) for
 *  anything not in this list — deliberately small and manually curated rather than a giant lookup
 *  table, since the whole point of this view is naming the handful of channels that actually
 *  matter, not cataloguing every possible domain. */
const HOST_LABELS: Record<string, string> = {
  "t.co": "Twitter/X",
  "twitter.com": "Twitter/X",
  "x.com": "Twitter/X",
  "google.com": "Google",
  "www.google.com": "Google",
  "bing.com": "Bing",
  "www.bing.com": "Bing",
  "producthunt.com": "Product Hunt",
  "www.producthunt.com": "Product Hunt",
  "indiehackers.com": "IndieHackers",
  "www.indiehackers.com": "IndieHackers",
  "news.ycombinator.com": "Hacker News",
  "reddit.com": "Reddit",
  "www.reddit.com": "Reddit",
  "linkedin.com": "LinkedIn",
  "www.linkedin.com": "LinkedIn",
};

function hostLabel(host: string): string {
  const bare = host.replace(/^www\./, "");
  return HOST_LABELS[host] ?? HOST_LABELS[bare] ?? bare;
}

function TrafficSourcesTable({ rows }: { rows: TrafficSourceRow[] }) {
  const days = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.day);
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [rows]);
  const [selectedDay, setSelectedDay] = useState("all");

  const { referrers, campaigns, selfReferralCount } = useMemo(() => {
    const referrerMap = new Map<string, number>();
    const campaignMap = new Map<string, number>();
    let selfCount = 0;
    for (const r of rows) {
      if (selectedDay !== "all" && r.day !== selectedDay) continue;
      if (r.event === "referral_source_detected" && r.source) {
        if (SELF_HOST_RE.test(r.source)) {
          selfCount += r.count;
          continue;
        }
        const label = hostLabel(r.source);
        referrerMap.set(label, (referrerMap.get(label) ?? 0) + r.count);
      } else if (r.event === "page_view" && r.attribution) {
        campaignMap.set(r.attribution, (campaignMap.get(r.attribution) ?? 0) + r.count);
      }
    }
    return {
      referrers: [...referrerMap.entries()].sort(([, a], [, b]) => b - a),
      campaigns: [...campaignMap.entries()].sort(([, a], [, b]) => b - a),
      selfReferralCount: selfCount,
    };
  }, [rows, selectedDay]);

  const nothingYet = referrers.length === 0 && campaigns.length === 0;

  return (
    <>
      <DayFilterSelect days={days} selectedDay={selectedDay} onChange={setSelectedDay} />
      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: -4 }}>
        Excludes {selfReferralCount} self-referral hit{selfReferralCount === 1 ? "" : "s"} (the site linking to
        itself, or bot traffic spoofing our own hostname) — this is only genuine external discovery.
      </p>
      {nothingYet ? (
        <p style={{ fontSize: 13, color: "var(--mute)" }}>No external referrers or tagged campaign clicks for this range.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
          <div
            style={{
              border: "1px solid var(--hairline)",
              borderRadius: "var(--r-sm)",
              padding: 12,
              background: "var(--canvas)",
              minWidth: 0,
            }}
          >
            <h4 style={{ fontSize: 13, marginTop: 0, marginBottom: 8 }}>External sites that linked here</h4>
            {referrers.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--mute)", margin: 0 }}>None yet.</p>
            ) : (
              // Deliberately not the shared .plan-table class — it forces a 520px min-width and a
              // sticky, pinned first column (both meant for the big pricing/plan comparison table),
              // which inside a narrow grid column made this table overflow and clipped the text.
              <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
                <colgroup>
                  <col />
                  <col style={{ width: 64 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", fontSize: 12, padding: "4px 8px 4px 0", borderBottom: "1px solid var(--hairline)" }}>
                      Site
                    </th>
                    <th style={{ textAlign: "right", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--hairline)" }}>
                      Visits
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referrers.map(([label, count]) => (
                    <tr key={label}>
                      <td style={{ fontSize: 13, padding: "6px 8px 6px 0", overflowWrap: "anywhere", borderBottom: "1px solid var(--hairline)" }}>
                        {label}
                      </td>
                      <td style={{ fontSize: 13, textAlign: "right", padding: "6px 0", borderBottom: "1px solid var(--hairline)" }}>
                        {count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div
            style={{
              border: "1px solid var(--hairline)",
              borderRadius: "var(--r-sm)",
              padding: 12,
              background: "var(--canvas)",
              minWidth: 0,
            }}
          >
            <h4 style={{ fontSize: 13, marginTop: 0, marginBottom: 8 }}>Tagged campaign clicks (utm/ref links)</h4>
            {campaigns.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--mute)", margin: 0 }}>None yet.</p>
            ) : (
              <div style={{ maxHeight: 260, overflowY: "auto", overflowX: "hidden" }}>
                <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
                  <colgroup>
                    <col />
                    <col style={{ width: 56 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", fontSize: 12, padding: "4px 8px 4px 0", borderBottom: "1px solid var(--hairline)" }}>
                        Campaign
                      </th>
                      <th style={{ textAlign: "right", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--hairline)" }}>
                        Clicks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map(([label, count]) => (
                      <tr key={label}>
                        <td
                          style={{
                            fontFamily: "ui-monospace, monospace",
                            fontSize: 12,
                            padding: "6px 8px 6px 0",
                            overflowWrap: "anywhere",
                            wordBreak: "break-all",
                            borderBottom: "1px solid var(--hairline)",
                          }}
                        >
                          {label}
                        </td>
                        <td style={{ fontSize: 13, textAlign: "right", padding: "6px 0", borderBottom: "1px solid var(--hairline)" }}>
                          {count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const ERROR_EVENTS: FunnelStepDef[] = [
  { event: "upload_failed", label: "Upload failed" },
  { event: "send_failed", label: "Send failed" },
  { event: "signature_error", label: "Signature error" },
  { event: "pdf_generation_failed", label: "PDF generation failed" },
];

/** Error counts aren't a funnel (there's no meaningful "conversion" between failure types, and no
 *  single one is a "KPI" to aim for — fewer is always better across the board), so this is a plain
 *  Event/Count table like FunnelCard's rows, just without the bar/KPI/conversion-% framing. */
function ErrorsCard({ stepsByEvent }: { stepsByEvent: Map<string, FunnelStepRow> }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0, fontSize: 15 }}>Error events</h3>
      <table className="plan-table plan-table-static" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Event</th>
            <th style={{ textAlign: "left" }}>Count</th>
          </tr>
        </thead>
        <tbody>
          {ERROR_EVENTS.map((e) => (
            <tr key={e.event}>
              <td style={{ fontFamily: "monospace", fontSize: 13 }}>{e.event}</td>
              <td>{stepsByEvent.get(e.event)?.totalCount ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ADMIN_SECTIONS = [
  "analytics",
  "growth",
  "blog",
  "marketplace",
  "roadmap",
  "signups",
  "activation",
  "completion",
  "templates",
  "traffic",
  "email",
  "errors",
] as const;
type AdminSection = (typeof ADMIN_SECTIONS)[number];
const ADMIN_SECTION_LABEL: Record<AdminSection, string> = {
  analytics: "Analytics",
  growth: "Growth",
  blog: "Blog posts",
  marketplace: "Marketplace",
  roadmap: "Roadmap",
  signups: "Signups",
  activation: "Activation",
  completion: "Completion",
  templates: "Templates",
  traffic: "Traffic events",
  email: "Email",
  errors: "Errors",
};

export default function AdminAnalytics() {
  usePageMeta("Analytics — Docracy", "Internal traffic and funnel analytics.");

  const [days, setDays] = useState(30);
  // Defaults on: the honest reading of any funnel that pairs a server-side load with a
  // client-side click (Traffic, above all) needs crawlers out of the denominator.
  const [humansOnly, setHumansOnly] = useState(true);
  const [rows, setRows] = useState<FunnelRow[] | null>(null);
  const [funnelSteps, setFunnelSteps] = useState<FunnelStepRow[] | null>(null);
  const [attribution, setAttribution] = useState<AttributionRow[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSourceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<AdminSection>("analytics");
  const [docDrilldown, setDocDrilldown] = useState<"sent" | "signed" | null>(null);

  // Founder visits are always excluded (ADMIN_EMAILS session + permanent notrack cookie). Claude
  // and Cursor agent traffic is filtered on write and in SQL reads — no toggle needed.
  useEffect(() => {
    setAnalyticsNoTrack(true).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminAnalytics(days, humansOnly)
      .then((res) => {
        if (!cancelled) {
          setRows(res.rows);
          setFunnelSteps(res.funnelSteps);
          setAttribution(res.attribution ?? []);
          setTrafficSources(res.trafficSources ?? []);
        }
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
  }, [days, humansOnly]);

  const stepsByEvent = useMemo(() => {
    const map = new Map<string, FunnelStepRow>();
    for (const r of funnelSteps ?? []) map.set(r.event, r);
    return map;
  }, [funnelSteps]);

  const totals = useMemo(() => {
    if (!rows) return null;
    const pageViews = rows.filter((r) => r.event === "page_view");
    const humanViews = sum(pageViews.filter((r) => r.traffic_type !== "bot"));
    const botViews = sum(pageViews.filter((r) => r.traffic_type === "bot"));
    const allViews = sum(pageViews);
    // Humans only applies to the headline Page views tile too — previously only funnel steps
    // were filtered, so the tile kept showing bot+human while the copy claimed otherwise.
    const totalViews = humansOnly ? humanViews : allViews;
    // Distinct-document counts (not SUM(double1)) — document_signed fires once per signer, so a
    // raw event count overcounts any multi-signer chain. COUNT(DISTINCT documentId) gives the
    // real per-document completion rate.
    const created = stepsByEvent.get("document_sent")?.distinctDocuments ?? 0;
    const completed = stepsByEvent.get("document_signed")?.distinctDocuments ?? 0;
    return {
      totalViews,
      botViews,
      allViews,
      botPct: allViews > 0 ? Math.round((botViews / allViews) * 100) : 0,
      created,
      completed,
      completionRate: created > 0 ? Math.round((completed / created) * 100) : null,
    };
  }, [rows, stepsByEvent, humansOnly]);

  return (
    <div className="container" style={{ maxWidth: 1200 }}>
      <h1 style={{ fontSize: 26 }}>Analytics</h1>
      <p style={{ color: "var(--mute)", marginTop: -8, marginBottom: 20 }}>
        Aggregate traffic and funnel counts — no per-visitor tracking, no IPs or cookies stored.
      </p>

      <div className="dashboard-shell admin-analytics-shell" style={{ maxWidth: "none", margin: 0, padding: 0 }}>
        <aside className="dashboard-sidebar admin-analytics-nav" aria-label="Admin sections">
          {ADMIN_SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`dashboard-nav-item${section === s ? " active" : ""}`}
              onClick={() => setSection(s)}
            >
              {ADMIN_SECTION_LABEL[s]}
            </button>
          ))}
        </aside>

        <div className="dashboard-content">
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
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
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginLeft: 4 }}>
              <input type="checkbox" checked={humansOnly} onChange={(e) => setHumansOnly(e.target.checked)} />
              Humans only
            </label>
          </div>

          <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 0, marginBottom: 20 }}>
            Your visits, Claude, and Cursor are always excluded from these charts.{" "}
            {humansOnly
              ? "Page views and funnel steps exclude classified crawlers (search, social previews, SEO tools, …). The daily chart still shows the bot split so you can see what was filtered out."
              : "Counts include crawler traffic, which inflates server-side page loads relative to click events that need a real browser."}
          </p>
          {/* Blog posts and Signups are backed by their own independent D1-only fetches (each
              card manages its own loading/error state) — they have no dependency on the
              Analytics Engine call below, so they must render regardless of whether that call
              succeeded. Every other section reads rows/totals/stepsByEvent from that call and
              only makes sense once it has resolved. */}
          {section === "blog" && <BlogPostsCard />}
          {section === "marketplace" && <MarketplaceReviewCard />}
          {section === "roadmap" && <RoadmapCard />}

          {section === "signups" && (
            <>
              <AllAccountsCard />
              <EnterpriseAccountsCard />
              <MarketingEmailCard />
            </>
          )}

          {section !== "blog" && section !== "signups" && (
            <>
              {loading && <p style={{ color: "var(--mute)" }}>Loading…</p>}
              {error && (
                <>
                  <div className="card" style={{ borderColor: "var(--danger)", color: "var(--danger)", marginBottom: 16 }}>
                    {error}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 0 }}>
                    Funnel and traffic charts need Analytics Engine. <strong>Blog posts</strong> and{" "}
                    <strong>Signups</strong> in the sidebar still work — they use the database directly.
                  </p>
                </>
              )}

              {!loading && !error && rows && totals && (
                <>
                  {section === "analytics" && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
                        <StatTile
                          label="Page views"
                          value={String(totals.totalViews)}
                          sub={
                            humansOnly
                              ? `${totals.botPct}% of all traffic was known bots (excluded)`
                              : `${totals.botPct}% known bots`
                          }
                        />
                        <StatTile
                          label="Documents sent"
                          value={String(totals.created)}
                          active={docDrilldown === "sent"}
                          onClick={() => setDocDrilldown((k) => (k === "sent" ? null : "sent"))}
                        />
                        <StatTile
                          label="Documents signed"
                          value={String(totals.completed)}
                          sub="distinct documents, not per-signer"
                          active={docDrilldown === "signed"}
                          onClick={() => setDocDrilldown((k) => (k === "signed" ? null : "signed"))}
                        />
                        <StatTile
                          label="Sent → signed"
                          value={totals.completionRate === null ? "—" : `${totals.completionRate}%`}
                        />
                      </div>
                      {docDrilldown && <DocumentsDrilldownCard days={days} kind={docDrilldown} />}
                      <div className="card" style={{ marginBottom: 16 }}>
                        <h3 style={{ marginTop: 0, fontSize: 15 }}>Real external traffic sources</h3>
                        <p style={{ fontSize: 12, color: "var(--mute)", marginTop: -4, marginBottom: 12 }}>
                          Where genuine visitors actually come from — the site linking to itself doesn't count.
                        </p>
                        <TrafficSourcesTable rows={trafficSources} />
                      </div>
                      <div className="card" style={{ marginBottom: 16 }}>
                        <h3 style={{ marginTop: 0, fontSize: 15 }}>Page views by day</h3>
                        <DailyViewsChart rows={rows} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                        <div className="card">
                          <h3 style={{ marginTop: 0, fontSize: 15 }}>By route</h3>
                          <RouteTable rows={rows} />
                        </div>
                        <div className="card">
                          <h3 style={{ marginTop: 0, fontSize: 15 }}>By bot</h3>
                          <BotTable rows={rows} />
                        </div>
                        <div className="card">
                          <h3 style={{ marginTop: 0, fontSize: 15 }}>By country</h3>
                          <CountryTable rows={rows} />
                        </div>
                      </div>
                    </>
                  )}

                  {section === "activation" && (
                    <FunnelCard
                      title="Activation funnel"
                      steps={ACTIVATION_STEPS}
                      countKey="totalCount"
                      stepsByEvent={stepsByEvent}
                      kpiEvent="document_sent"
                    />
                  )}

                  {section === "growth" && (
                    <>
                      <FunnelCard
                        title="Revenue funnel"
                        note="upgrade_clicked → checkout_started gap is price bounce; checkout_started → checkout_completed is Stripe drop-off."
                        steps={REVENUE_STEPS}
                        countKey="totalCount"
                        stepsByEvent={stepsByEvent}
                        kpiEvent="checkout_completed"
                      />
                      <div className="card" style={{ marginTop: 16 }}>
                        <h3 style={{ marginTop: 0, fontSize: 15 }}>Attribution by channel</h3>
                        <p style={{ color: "var(--mute)", fontSize: 13, marginTop: 0 }}>
                          First-touch UTM/ref that brought the visitor (e.g. linkedin/post-09-price). Empty = direct.
                        </p>
                        <AttributionTable rows={attribution} />
                      </div>
                    </>
                  )}

                  {section === "completion" && (
                    <FunnelCard
                      title="Completion funnel"
                      note="Counts distinct documents (not raw events) — document_signed fires once per signer, so this corrects for multi-signer chains."
                      steps={COMPLETION_STEPS}
                      sideStats={COMPLETION_SIDE_STATS}
                      countKey="distinctDocuments"
                      stepsByEvent={stepsByEvent}
                      kpiEvent="document_signed"
                    />
                  )}

                  {section === "templates" && (
                    <FunnelCard
                      title="Template funnel"
                      steps={TEMPLATE_STEPS}
                      sideStats={TEMPLATE_SIDE_STATS}
                      countKey="totalCount"
                      stepsByEvent={stepsByEvent}
                      kpiEvent="template_completed"
                    />
                  )}

                  {section === "traffic" && (
                    <FunnelCard
                      title="Traffic events"
                      note="The last row's “% of previous” is the JS-confirmation rate: page_view fires server-side for every request (bots included, on purpose); page_view_js only fires from a real browser executing our JS. A big gap between them on a given route means non-JS bot traffic or JS-disabled visitors."
                      steps={TRAFFIC_STEPS}
                      countKey="totalCount"
                      stepsByEvent={stepsByEvent}
                      kpiEvent="landingpage_cta_clicked"
                    />
                  )}

                  {section === "email" && (
                    <FunnelCard
                      title="Email funnel"
                      steps={EMAIL_STEPS}
                      countKey="totalCount"
                      stepsByEvent={stepsByEvent}
                      kpiEvent="email_clicked"
                    />
                  )}

                  {section === "errors" && <ErrorsCard stepsByEvent={stepsByEvent} />}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

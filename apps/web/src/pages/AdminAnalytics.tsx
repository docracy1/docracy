import { useEffect, useMemo, useState } from "react";
import {
  createBlogPost,
  deleteBlogPost,
  fetchAdminAccounts,
  fetchAdminAnalytics,
  fetchAdminBlogPost,
  fetchAdminBlogPosts,
  fetchAdminEnterpriseAccounts,
  grantEnterprise,
  setAnalyticsNoTrack,
  updateBlogPost,
  type AdminAccount,
  type AdminEnterpriseAccount,
  type DynamicBlogPostSummary,
  type FunnelRow,
  type FunnelStepRow,
  type AttributionRow,
} from "../lib/api";
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
  );
}

function CountryTable({ rows }: { rows: FunnelRow[] }) {
  const days = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.event === "page_view") set.add(r.day);
    }
    return [...set].sort((a, b) => b.localeCompare(a)); // most recent first
  }, [rows]);

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
      <select
        className="form-input"
        aria-label="Filter by day"
        value={selectedDay}
        onChange={(e) => setSelectedDay(e.target.value)}
        style={{ fontSize: 13, padding: "4px 8px", marginBottom: 10, width: "auto" }}
      >
        <option value="all">All days</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<AdminSection>("analytics");

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
    const totalViews = sum(pageViews);
    const botViews = sum(pageViews.filter((r) => r.traffic_type === "bot"));
    // Distinct-document counts (not SUM(double1)) — document_signed fires once per signer, so a
    // raw event count overcounts any multi-signer chain. COUNT(DISTINCT documentId) gives the
    // real per-document completion rate.
    const created = stepsByEvent.get("document_sent")?.distinctDocuments ?? 0;
    const completed = stepsByEvent.get("document_signed")?.distinctDocuments ?? 0;
    return {
      totalViews,
      botPct: totalViews > 0 ? Math.round((botViews / totalViews) * 100) : 0,
      created,
      completed,
      completionRate: created > 0 ? Math.round((completed / created) * 100) : null,
    };
  }, [rows, stepsByEvent]);

  return (
    <div className="container" style={{ maxWidth: 1200 }}>
      <h1 style={{ fontSize: 26 }}>Analytics</h1>
      <p style={{ color: "var(--mute)", marginTop: -8, marginBottom: 20 }}>
        Aggregate traffic and funnel counts — no per-visitor tracking, no IPs or cookies stored.
      </p>

      <div className="dashboard-shell" style={{ maxWidth: "none", margin: 0, padding: 0 }}>
        <aside className="dashboard-sidebar">
          {ADMIN_SECTIONS.map((s) => (
            <button
              key={s}
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
              ? "Funnel step counts exclude all other classified crawlers (GPTBot, Googlebot, PerplexityBot, …) — page loads and CTA clicks are then measured against the same audience."
              : "Funnel step counts include crawler traffic, which inflates server-side page loads relative to click events that need a real browser."}
          </p>
          {/* Blog posts and Signups are backed by their own independent D1-only fetches (each
              card manages its own loading/error state) — they have no dependency on the
              Analytics Engine call below, so they must render regardless of whether that call
              succeeded. Every other section reads rows/totals/stepsByEvent from that call and
              only makes sense once it has resolved. */}
          {section === "blog" && <BlogPostsCard />}

          {section === "signups" && (
            <>
              <AllAccountsCard />
              <EnterpriseAccountsCard />
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
                        <StatTile label="Page views" value={String(totals.totalViews)} sub={`${totals.botPct}% known bots`} />
                        <StatTile label="Documents sent" value={String(totals.created)} />
                        <StatTile label="Documents signed" value={String(totals.completed)} sub="distinct documents, not per-signer" />
                        <StatTile
                          label="Sent → signed"
                          value={totals.completionRate === null ? "—" : `${totals.completionRate}%`}
                        />
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

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FREE_TEMPLATES } from "../lib/freeTemplates";
import { usePageMeta } from "../lib/usePageMeta";

export default function FreeTemplates() {
  usePageMeta(
    "Free Business Document Templates — NDA, Contractor Agreement, Offer Letter | Docracy",
    "Free, ready-to-sign templates for the most common business documents — mutual NDA, independent contractor " +
      "agreement, offer letter, remote work policy, and freelance service agreement. Fill in your details and send " +
      "for signature in minutes."
  );

  // WebMCP (https://webmachinelearning.github.io/webmcp/) — a very early, experimental proposal
  // for a page to expose tools directly to an in-browser AI agent, separate from the remote MCP
  // connector (which works without a browser tab open at all). Feature-detected: unsupported in
  // essentially every browser today, so this is a no-op everywhere it doesn't exist yet. Read-only,
  // matching how every other agent-facing tool this site exposes (MCP's check_status/
  // find_documents) is deliberately read-only too — it returns matches, it doesn't navigate the
  // page or place an order on the caller's behalf.
  useEffect(() => {
    const modelContext = (navigator as unknown as { modelContext?: { provideContext: (ctx: unknown) => void } }).modelContext;
    if (!modelContext?.provideContext) return;
    try {
      modelContext.provideContext({
        tools: [
          {
            name: "find_free_template",
            description:
              'Search Docracy\'s free, ready-to-sign document templates by name or use case (e.g. "NDA", "contractor", "lease").',
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "A word or phrase to match against template names and descriptions." },
              },
              required: ["query"],
            },
            async execute({ query }: { query: string }) {
              const q = query.trim().toLowerCase();
              const matches = FREE_TEMPLATES.filter(
                (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
              ).map((t) => ({
                name: t.name,
                description: t.description,
                url: `https://docracy.io/free-templates/${t.slug}`,
              }));
              return { matches };
            },
          },
        ],
      });
    } catch {
      // Experimental, unstable API — never let an unexpected shape/behavior break the page.
    }
  }, []);

  return (
    <div className="container">
      <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>Ready-to-use templates for quick agreements</h1>
      <p style={{ maxWidth: 640, fontSize: 14, color: "var(--body)" }}>
        Docracy.io provides simple, ready-to-use templates you can send in minutes. Choose a template, add signature
        fields, and send it — no formatting, no setup, no accounts required.
      </p>

      <p style={{ maxWidth: 640, fontSize: 14, fontWeight: 700, margin: "16px 0 8px" }}>How it works:</p>
      <ol style={{ maxWidth: 640, fontSize: 14, color: "var(--body)", margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
        <li>Select a template</li>
        <li>Add the fields you need</li>
        <li>Send it for signature</li>
      </ol>

      <p style={{ maxWidth: 640, fontSize: 14, fontWeight: 700, margin: "16px 0 8px" }}>Popular templates:</p>
      <ul style={{ maxWidth: 640, fontSize: 14, color: "var(--body)", margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
        <li>NDA (one-way or mutual)</li>
        <li>Client contract</li>
        <li>Service agreement</li>
        <li>Onboarding agreement</li>
        <li>Vendor agreement</li>
        <li>Rental agreement</li>
        <li>Work order</li>
        <li>Delivery confirmation</li>
      </ul>

      <p style={{ maxWidth: 640, fontSize: 13, color: "var(--mute)", fontStyle: "italic", margin: "16px 0 28px" }}>
        Tip: Using a template is the fastest way to send your first document.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {FREE_TEMPLATES.map((t) => (
          <Link
            key={t.slug}
            to={`/free-templates/${t.slug}`}
            className="card"
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>{t.name}</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--mute)" }}>{t.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { Link, useParams } from "react-router-dom";
import { getBlogPost } from "../lib/blog";
import { getCompetitor, formatUsd, DOCRACY_PRICE } from "../lib/competitors";
import { usePageMeta } from "../lib/usePageMeta";

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  usePageMeta(post ? `${post.title} | Docracy` : "Post not found | Docracy", post?.description ?? "This post couldn't be found.");

  if (!post) {
    return (
      <div className="container">
        <h1>Post not found</h1>
        <p>
          <Link to="/blog">Back to the blog</Link>
        </p>
      </div>
    );
  }

  const competitor = getCompetitor(post.competitorKey);

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <p style={{ fontSize: 13 }}>
        <Link to="/blog">← All posts</Link>
      </p>
      <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>{post.publishedDate}</div>
      <h1>{post.title}</h1>

      {post.intro.map((p, i) => (
        <p key={i}>{p}</p>
      ))}

      {competitor && (
        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--mute)" }}>Docracy</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{formatUsd(DOCRACY_PRICE)}/mo flat</div>
          </div>
          <div style={{ fontSize: 18, color: "var(--mute)" }}>vs</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--mute)" }}>{competitor.name}</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>
              {formatUsd(competitor.pricePerSeat)}/user/mo
            </div>
            <a href={competitor.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
              their pricing →
            </a>
          </div>
        </div>
      )}

      {post.sections.map((section) => (
        <div key={section.heading} style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 19 }}>{section.heading}</h2>
          {section.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ))}

      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 19 }}>Verdict</h2>
        <p>{post.verdict}</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <Link to="/prepare" className="btn-primary" style={{ textDecoration: "none" }}>
          Try Docracy free
        </Link>
        <Link to="/pricing" className="btn-secondary" style={{ textDecoration: "none" }}>
          See pricing
        </Link>
      </div>

      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 32 }}>
        Prices reflect each vendor's published pricing as of {post.publishedDate} — check their pricing page
        for current numbers before deciding. Docracy doesn't verify identity — the audit trail proves what
        was signed and when, not who actually signed it.
      </p>
    </div>
  );
}

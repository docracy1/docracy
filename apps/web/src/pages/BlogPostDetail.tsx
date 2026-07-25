import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBlogPost } from "../lib/blog";
import { getCompetitor, formatUsd, DOCRACY_PRICE } from "../lib/competitors";
import { fetchBlogPost, type DynamicBlogPostDetail } from "../lib/api";
import { usePageMeta } from "../lib/usePageMeta";

/** Renders a plain-text body as paragraphs split on blank lines — the same convention the static
 *  competitor-comparison posts already use for their intro/section text, just applied to a single
 *  freeform field instead of a structured intro/sections/verdict shape. */
function BodyParagraphs({ body }: { body: string }) {
  return (
    <>
      {body
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </>
  );
}

function DynamicPostView({ post }: { post: DynamicBlogPostDetail }) {
  usePageMeta(`${post.title} | Docracy`, post.description || post.title);
  const date = (post.publishedAt ?? post.createdAt).slice(0, 10);

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <p style={{ fontSize: 13 }}>
        <Link to="/blog">← All posts</Link>
      </p>
      <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>{date}</div>
      <h1>{post.title}</h1>
      <BodyParagraphs body={post.body} />
      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <Link to="/prepare" className="btn-primary" style={{ textDecoration: "none" }}>
          Try Docracy free
        </Link>
        <Link to="/pricing" className="btn-secondary" style={{ textDecoration: "none" }}>
          See pricing
        </Link>
      </div>
    </div>
  );
}

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const staticPost = slug ? getBlogPost(slug) : undefined;

  const [dynamicPost, setDynamicPost] = useState<DynamicBlogPostDetail | null>(null);
  const [dynamicNotFound, setDynamicNotFound] = useState(false);

  useEffect(() => {
    if (staticPost || !slug) return;
    fetchBlogPost(slug)
      .then((res) => setDynamicPost(res.post))
      .catch(() => setDynamicNotFound(true));
  }, [slug, staticPost]);

  usePageMeta(
    staticPost ? `${staticPost.title} | Docracy` : "Loading… | Docracy",
    staticPost?.description ?? "This post couldn't be found."
  );

  if (staticPost) {
    const competitor = getCompetitor(staticPost.competitorKey);
    return (
      <div className="container" style={{ maxWidth: 720 }}>
        <p style={{ fontSize: 13 }}>
          <Link to="/blog">← All posts</Link>
        </p>
        <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>{staticPost.publishedDate}</div>
        <h1>{staticPost.title}</h1>

        {staticPost.intro.map((p, i) => (
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

        {staticPost.sections.map((section) => (
          <div key={section.heading} style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 19 }}>{section.heading}</h2>
            {section.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ))}

        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 19 }}>Verdict</h2>
          <p>{staticPost.verdict}</p>
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
          Prices reflect each vendor's published pricing as of {staticPost.publishedDate} — check their pricing
          page for current numbers before deciding. Docracy doesn't verify identity — the audit trail proves what
          was signed and when, not who actually signed it.
        </p>
      </div>
    );
  }

  if (dynamicPost) return <DynamicPostView post={dynamicPost} />;

  if (dynamicNotFound) {
    return (
      <div className="container">
        <h1>Post not found</h1>
        <p>
          <Link to="/blog">Back to the blog</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      <p>Loading…</p>
    </div>
  );
}

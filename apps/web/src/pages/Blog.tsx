import { Link } from "react-router-dom";
import { BLOG_POSTS } from "../lib/blog";
import { usePageMeta } from "../lib/usePageMeta";

export default function Blog() {
  usePageMeta(
    "Blog — Docracy",
    "How Docracy compares to eversign, DocuSign, PandaDoc, and Adobe Acrobat Sign — honest, sourced comparisons on price and features."
  );

  return (
    <div className="container">
      <h1 style={{ fontSize: 30 }}>Blog</h1>
      <p style={{ maxWidth: 640 }}>Honest, sourced comparisons between Docracy and the other e-signature tools people ask us about.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
        {BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            className="card"
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 6 }}>{post.publishedDate}</div>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>{post.title}</h3>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--mute)" }}>{post.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BLOG_POSTS } from "../lib/blog";
import { fetchBlogPosts, type DynamicBlogPostSummary } from "../lib/api";
import { usePageMeta } from "../lib/usePageMeta";

interface MergedPost {
  slug: string;
  title: string;
  description: string;
  date: string;
}

export default function Blog() {
  usePageMeta(
    "Blog — Docracy",
    "How Docracy compares to eversign, DocuSign, PandaDoc, and Adobe Acrobat Sign — honest, sourced comparisons on price and features."
  );

  const [dynamicPosts, setDynamicPosts] = useState<DynamicBlogPostSummary[]>([]);

  useEffect(() => {
    fetchBlogPosts()
      .then((res) => setDynamicPosts(res.posts))
      .catch(() => {}); // The 4 static comparison posts below still render either way.
  }, []);

  const merged: MergedPost[] = [
    ...BLOG_POSTS.map((p) => ({ slug: p.slug, title: p.title, description: p.description, date: p.publishedDate })),
    ...dynamicPosts.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      date: (p.publishedAt ?? p.createdAt).slice(0, 10),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="container">
      <h1 style={{ fontSize: 30 }}>Blog</h1>
      <p style={{ maxWidth: 640 }}>Honest, sourced comparisons between Docracy and the other e-signature tools people ask us about.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
        {merged.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            className="card"
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 6 }}>{post.date}</div>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>{post.title}</h3>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--mute)" }}>{post.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

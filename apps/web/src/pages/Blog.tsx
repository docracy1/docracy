import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BLOG_POSTS } from "../lib/blog";
import { ARTICLES, CLUSTER_ORDER } from "../lib/articles";
import { fetchBlogPosts, type DynamicBlogPostSummary } from "../lib/api";
import { useT } from "../lib/i18n";
import { usePageMeta } from "../lib/usePageMeta";

interface MergedPost {
  slug: string;
  title: string;
  description: string;
  date: string;
}

function PostCard({ post }: { post: MergedPost }) {
  return (
    <Link to={`/blog/${post.slug}`} className="card" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 6 }}>{post.date}</div>
      <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>{post.title}</h3>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--mute)" }}>{post.description}</p>
    </Link>
  );
}

export default function Blog() {
  const t = useT();
  usePageMeta(
    "Blog — Docracy",
    "Guides on NDAs, contracts, and online signatures, plus honest comparisons between Docracy and the other e-signature tools people ask us about."
  );

  const [dynamicPosts, setDynamicPosts] = useState<DynamicBlogPostSummary[]>([]);

  useEffect(() => {
    fetchBlogPosts()
      .then((res) => setDynamicPosts(res.posts))
      .catch(() => {}); // The static posts below still render either way.
  }, []);

  const clusters = CLUSTER_ORDER.map((cluster) => ({
    cluster,
    posts: ARTICLES.filter((a) => a.cluster === cluster).map((a) => ({
      slug: a.slug,
      title: a.title,
      description: a.description,
      date: a.publishedDate,
    })),
  })).filter((c) => c.posts.length > 0);

  const more: MergedPost[] = [
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
      <h1 style={{ fontSize: 30 }}>{t("blog.title")}</h1>
      <p style={{ maxWidth: 640 }}>{t("blog.subtitle")}</p>

      {clusters.map(({ cluster, posts }) => (
        <div key={cluster} style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 19 }}>{cluster}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      ))}

      {more.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 19 }}>{t("blog.moreFromBlog")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {more.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

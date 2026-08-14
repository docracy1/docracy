import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BLOG_POSTS } from "../lib/blog";
import { ARTICLES, CLUSTER_ORDER } from "../lib/articles";
import { fetchBlogPosts, type DynamicBlogPostSummary } from "../lib/api";
import { useT } from "../lib/i18n";
import { usePageMeta } from "../lib/usePageMeta";
import { BlogHeroArt, CompetitorHeroArt, gradientForSlug, topicForCluster, type BlogTopic } from "../components/BlogHeroArt";

interface MergedPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  topic: BlogTopic;
  competitorKey?: string;
}

function PostCard({ post }: { post: MergedPost }) {
  const t = useT();
  return (
    <Link to={`/blog/${post.slug}`} className="card" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div className="blog-card-hero" style={{ background: gradientForSlug(post.slug) }}>
        {post.competitorKey ? <CompetitorHeroArt competitorKey={post.competitorKey} /> : <BlogHeroArt slug={post.slug} topic={post.topic} />}
      </div>
      <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 6 }}>{post.date}</div>
      <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>{post.title}</h3>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--mute)" }}>{post.description}</p>
      <div className="blog-card-byline">
        <img src="/docracy-seal-icon.png" alt="" />
        <span>{t("blog.byline")}</span>
      </div>
    </Link>
  );
}

export default function Blog() {
  const t = useT();
  usePageMeta(
    "Docracy Blog — E-Signature & Contract Guides",
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
      topic: topicForCluster(cluster),
    })),
  })).filter((c) => c.posts.length > 0);

  const more: MergedPost[] = [
    ...BLOG_POSTS.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      date: p.publishedDate,
      topic: "comparison" as BlogTopic,
      competitorKey: p.competitorKey,
    })),
    ...dynamicPosts.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      date: (p.publishedAt ?? p.createdAt).slice(0, 10),
      topic: "general" as BlogTopic,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // Featured pick draws only from content known at first render (clusters + static BLOG_POSTS,
  // not the async dynamicPosts fetch) so the hero card never shifts after mount or diverges from
  // what prerender.mjs's static render produces.
  const featuredCandidates = [
    ...clusters.flatMap(({ cluster, posts }) =>
      posts.map((p) => ({ ...p, category: cluster, competitorKey: undefined as string | undefined }))
    ),
    ...BLOG_POSTS.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      date: p.publishedDate,
      topic: "comparison" as BlogTopic,
      competitorKey: p.competitorKey as string | undefined,
      category: t("blog.moreFromBlog"),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const featured = featuredCandidates[0];
  const isNew = featured ? Date.parse(featured.date) > Date.now() - 21 * 24 * 60 * 60 * 1000 : false;

  return (
    <div className="container">
      <div className="blog-hero">
        <h1 className="blog-hero-title">{t("blog.title")}</h1>
        <p className="blog-hero-subtitle">{t("blog.subtitle")}</p>
      </div>

      {featured && (
        <div className="blog-featured-grid">
          <Link to={`/blog/${featured.slug}`} className="blog-featured-card" style={{ textDecoration: "none" }}>
            <div className="blog-featured-hero" style={{ background: gradientForSlug(featured.slug) }}>
              {featured.competitorKey ? (
                <CompetitorHeroArt competitorKey={featured.competitorKey} />
              ) : (
                <BlogHeroArt slug={featured.slug} topic={featured.topic} />
              )}
            </div>
            {isNew && <span className="blog-featured-badge">{t("blog.newBadge")}</span>}
            <span className="blog-featured-tag">{featured.category}</span>
            <h2 className="blog-featured-title">{featured.title}</h2>
            <p className="blog-featured-excerpt">{featured.description}</p>
            <div className="blog-card-byline">
              <img src="/docracy-seal-icon.png" alt="" />
              <span>{t("blog.byline")}</span>
            </div>
            <span className="blog-pill-btn">{t("blog.readArticle")}</span>
          </Link>

          <div className="blog-quick-help">
            <h3 className="blog-quick-help-title">{t("blog.quickHelpTitle")}</h3>
            <p className="blog-quick-help-body">{t("blog.quickHelpBody")}</p>
            <div className="blog-quick-help-actions">
              <button
                type="button"
                className="blog-pill-btn-solid-light"
                onClick={() => window.dispatchEvent(new Event("docracy:open-chat"))}
              >
                {t("blog.askAQuestion")}
              </button>
              <Link to="/prepare" className="blog-pill-btn-outline">
                {t("blog.startFree")}
              </Link>
            </div>
            <p className="blog-quick-help-tip">{t("blog.quickHelpTip")}</p>
          </div>
        </div>
      )}

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

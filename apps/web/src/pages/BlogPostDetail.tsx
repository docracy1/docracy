import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBlogPost } from "../lib/blog";
import { getArticle, type ArticleBlock } from "../lib/articles";
import { getCompetitor, formatUsd, DOCRACY_PRICE } from "../lib/competitors";
import { fetchBlogPost, type DynamicBlogPostDetail } from "../lib/api";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";
import { useT } from "../lib/i18n";
import { BlogHeroArt, CompetitorHeroArt, gradientForSlug, topicForCluster, type BlogTopic } from "../components/BlogHeroArt";

function BlogHero({ slug, topic, competitorKey }: { slug: string; topic: BlogTopic; competitorKey?: string }) {
  return (
    <div className="blog-post-hero" style={{ background: gradientForSlug(slug) }}>
      {competitorKey ? <CompetitorHeroArt competitorKey={competitorKey} /> : <BlogHeroArt slug={slug} topic={topic} />}
    </div>
  );
}

function BlogByline({ date }: { date: string }) {
  const t = useT();
  return (
    <div className="blog-byline">
      <img src="/docracy-seal-icon.png" alt="" />
      <div>
        <div className="blog-byline-name">{t("blog.byline")}</div>
        <div className="blog-byline-date">{date}</div>
      </div>
    </div>
  );
}

/** The "Try Docracy free" / "See pricing" pair every post type ends with — `slug` is passed
 *  through as the click's `source` so blog_cta_clicked can be attributed back to which post
 *  drove it. */
function BlogCta({ slug }: { slug: string }) {
  const t = useT();
  const isW9 = slug.includes("w-9");
  const prepareTo = isW9 ? `/prepare?ref=blog-${slug}` : `/prepare?freeTemplate=mutual-nda&ref=blog-${slug}`;
  const prepareLabel = isW9 ? t("blog.uploadW9") : t("blog.tryFreeSampleNda");

  return (
    <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
      <Link
        to={prepareTo}
        className="btn-primary"
        style={{ textDecoration: "none" }}
        onClick={() => track("blog_cta_clicked", { source: slug })}
      >
        {prepareLabel}
      </Link>
      <Link
        to={`/pricing?ref=blog-${slug}`}
        className="btn-secondary"
        style={{ textDecoration: "none" }}
        onClick={() => track("blog_cta_clicked", { source: slug })}
      >
        {t("blog.seePricing")}
      </Link>
    </div>
  );
}

/** Renders CMS / weekly-cron body text: blank-line paragraphs, `##` / `###` headings, `- ` lists. */
function BodyParagraphs({ body }: { body: string }) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: Array<
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | { type: "h3"; text: string }
    | { type: "list"; items: string[] }
  > = [];

  let para: string[] = [];
  let listItems: string[] | null = null;

  const flushPara = () => {
    const text = para.join(" ").trim();
    if (text) blocks.push({ type: "p", text });
    para = [];
  };
  const flushList = () => {
    if (listItems?.length) blocks.push({ type: "list", items: listItems });
    listItems = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      flushPara();
      flushList();
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushPara();
      flushList();
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      continue;
    }
    if (trimmed.startsWith("### ")) {
      flushPara();
      flushList();
      blocks.push({ type: "h3", text: trimmed.slice(4).trim() });
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      flushPara();
      if (!listItems) listItems = [];
      listItems.push(trimmed.replace(/^[-*]\s+/, "").trim());
      continue;
    }
    flushList();
    para.push(trimmed);
  }
  flushPara();
  flushList();

  const toc = blocks.filter((b): b is { type: "h2"; text: string } => b.type === "h2");

  return (
    <>
      {toc.length >= 3 && (
        <nav className="blog-toc" aria-label="Table of contents">
          <div className="blog-toc-title">Table of contents</div>
          <ol>
            {toc.map((item) => (
              <li key={item.text}>
                <a href={`#${slugifyHeading(item.text)}`}>{item.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {blocks.map((block, i) => {
        if (block.type === "list") {
          return (
            <ul key={i} style={{ margin: "0 0 1em", paddingLeft: 20 }}>
              {block.items.map((item, j) => (
                <li key={j} style={{ marginBottom: 4 }}>
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "h2") {
          return (
            <h2 key={i} id={slugifyHeading(block.text)} style={{ fontSize: 19, marginTop: 28 }}>
              {block.text}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={i} style={{ fontSize: 16, marginTop: 20, marginBottom: 6 }}>
              {block.text}
            </h3>
          );
        }
        return <p key={i}>{block.text}</p>;
      })}
    </>
  );
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function ArticleBlocks({ blocks }: { blocks: ArticleBlock[] }) {
  const toc = blocks.filter((b): b is Extract<ArticleBlock, { type: "h2" }> => b.type === "h2");

  return (
    <>
      {toc.length >= 3 && (
        <nav className="blog-toc" aria-label="Table of contents">
          <div className="blog-toc-title">Table of contents</div>
          <ol>
            {toc.map((item) => (
              <li key={item.text}>
                <a href={`#${slugifyHeading(item.text)}`}>{item.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {blocks.map((block, i) => {
        if (block.type === "list") {
          return (
            <ul key={i} style={{ margin: "0 0 1em", paddingLeft: 20 }}>
              {block.items.map((item, j) => (
                <li key={j} style={{ marginBottom: 4 }}>
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "h2") {
          return (
            <h2 key={i} id={slugifyHeading(block.text)} style={{ fontSize: 19, marginTop: 28 }}>
              {block.text}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={i} style={{ fontSize: 16, marginTop: 20, marginBottom: 6 }}>
              {block.text}
            </h3>
          );
        }
        if (block.type === "img") {
          return (
            <figure key={i} className="blog-figure">
              <img src={block.src} alt={block.alt} loading="lazy" />
              {block.caption ? <figcaption>{block.caption}</figcaption> : null}
            </figure>
          );
        }
        if (block.type === "link") {
          return (
            <p key={i}>
              <Link to={block.to}>{block.text}</Link>
            </p>
          );
        }
        if (block.type === "video") {
          return (
            <div key={i} style={{ position: "relative", paddingBottom: "56.25%", height: 0, margin: "20px 0" }}>
              <iframe
                src={`https://www.youtube.com/embed/${block.youtubeId}`}
                title={block.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, borderRadius: 8 }}
              />
            </div>
          );
        }
        return <p key={i}>{block.text}</p>;
      })}
    </>
  );
}

function DynamicPostView({ post }: { post: DynamicBlogPostDetail }) {
  const t = useT();
  usePageMeta(`${post.title} | Docracy`, post.description || post.title, {
    canonicalPath: `/blog/${post.slug}`,
  });
  const date = (post.publishedAt ?? post.createdAt).slice(0, 10);

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <p style={{ fontSize: 13 }}>
        <Link to="/blog">{t("blog.allPosts")}</Link>
      </p>
      <h1>{post.title}</h1>
      <BlogHero slug={post.slug} topic="general" />
      <BlogByline date={date} />
      <BodyParagraphs body={post.body} />
      <BlogCta slug={post.slug} />
    </div>
  );
}

function readPreloadedBlogPost(slug: string): DynamicBlogPostDetail | null {
  if (typeof document === "undefined") return null;
  const el = document.getElementById("__PRELOADED_BLOG_POST__");
  if (!el?.textContent) return null;
  try {
    const data = JSON.parse(el.textContent) as { post?: DynamicBlogPostDetail };
    if (data.post?.slug === slug) return data.post;
  } catch {
    return null;
  }
  return null;
}

export default function BlogPostDetail() {
  const t = useT();
  const { slug } = useParams<{ slug: string }>();
  const staticPost = slug ? getBlogPost(slug) : undefined;
  const article = !staticPost && slug ? getArticle(slug) : undefined;

  const [dynamicPost, setDynamicPost] = useState<DynamicBlogPostDetail | null>(() =>
    slug && !staticPost && !article ? readPreloadedBlogPost(slug) : null
  );
  const [dynamicNotFound, setDynamicNotFound] = useState(false);

  useEffect(() => {
    if (staticPost || article || !slug) return;
    if (dynamicPost?.slug === slug) return;
    fetchBlogPost(slug)
      .then((res) => setDynamicPost(res.post))
      .catch(() => setDynamicNotFound(true));
  }, [slug, staticPost, article, dynamicPost?.slug]);

  const pageTitle = staticPost
    ? `${staticPost.title} | Docracy`
    : article
      ? `${article.title} | Docracy`
      : dynamicPost
        ? `${dynamicPost.title} | Docracy`
        : dynamicNotFound
          ? "Post not found | Docracy"
          : "Loading… | Docracy";
  const pageDescription =
    staticPost?.description ??
    article?.description ??
    dynamicPost?.description ??
    dynamicPost?.title ??
    (dynamicNotFound ? "This post couldn't be found." : "Docracy blog");

  usePageMeta(pageTitle, pageDescription, {
    canonicalPath: slug ? `/blog/${slug}` : "/blog",
  });

  if (article) {
    return (
      <div className="container" style={{ maxWidth: 720 }}>
        <p style={{ fontSize: 13 }}>
          <Link to="/blog">{t("blog.allPosts")}</Link>
        </p>
        <h1>{article.title}</h1>
        <BlogHero slug={article.slug} topic={topicForCluster(article.cluster)} />
        <BlogByline date={article.publishedDate} />
        <ArticleBlocks blocks={article.blocks} />
        <BlogCta slug={article.slug} />
      </div>
    );
  }

  if (staticPost) {
    const competitor = getCompetitor(staticPost.competitorKey);
    return (
      <div className="container" style={{ maxWidth: 720 }}>
        <p style={{ fontSize: 13 }}>
          <Link to="/blog">{t("blog.allPosts")}</Link>
        </p>
        <h1>{staticPost.title}</h1>
        <BlogHero slug={staticPost.slug} topic="comparison" competitorKey={staticPost.competitorKey} />
        <BlogByline date={staticPost.publishedDate} />

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

        <BlogCta slug={staticPost.slug} />

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
        <h1>{t("blog.postNotFound")}</h1>
        <p>
          <Link to="/blog">{t("blog.backToBlog")}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      <p>{t("common.loading")}</p>
    </div>
  );
}

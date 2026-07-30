const WORKER_URL = "https://api.docracy.io";
const SITE = "https://docracy.io";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraphs(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

/**
 * SSR for D1-backed weekly blog posts. Prerendered static `/blog/*.html` assets still win
 * (Pages serves static files before Functions). Missing static posts fall through here instead
 * of the SPA homepage shell, so crawlers get real title/canonical/body.
 */
export const onRequest: PagesFunction<{ ASSETS: Fetcher }> = async (context) => {
  const url = new URL(context.request.url);
  const slug = url.pathname.replace(/^\/blog\//, "").replace(/\/+$/, "");
  if (!slug || slug.includes("/") || slug.includes(".")) {
    return context.next();
  }

  let post: {
    title: string;
    description?: string | null;
    body: string;
    publishedAt?: string | null;
    createdAt: string;
  } | null = null;
  try {
    const res = await fetch(`${WORKER_URL}/api/blog-posts/${encodeURIComponent(slug)}`);
    if (res.ok) {
      const data = (await res.json()) as { post: NonNullable<typeof post> };
      post = data.post;
    }
  } catch {
    post = null;
  }

  if (!post) {
    return context.next();
  }

  const title = `${post.title} | Docracy`;
  const description = (post.description || post.title).slice(0, 300);
  const canonical = `${SITE}/blog/${encodeURIComponent(slug)}`;
  const date = (post.publishedAt ?? post.createdAt).slice(0, 10);
  const preload = JSON.stringify({ post }).replace(/</g, "\\u003c");

  let shell = "<!doctype html><html><head></head><body><div id=\"root\"></div></body></html>";
  try {
    const indexRes = await context.env.ASSETS.fetch(new Request(new URL("/index.html", url), context.request));
    if (indexRes.ok) shell = await indexRes.text();
  } catch {
    // use minimal shell
  }

  const metaBlock = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <script type="application/json" id="__PRELOADED_BLOG_POST__">${preload}</script>
  `;

  const articleHtml = `
    <div class="container" style="max-width:720px;margin:0 auto;padding:24px" data-ssr-blog="1">
      <p style="font-size:13px"><a href="/blog">← All posts</a></p>
      <div style="font-size:12px;color:#6b7785;margin-bottom:4px">${escapeHtml(date)}</div>
      <h1>${escapeHtml(post.title)}</h1>
      ${paragraphs(post.body)}
    </div>
  `;

  let html = shell;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`
  );
  if (!html.includes('id="__PRELOADED_BLOG_POST__"')) {
    html = html.replace(/<\/head>/i, `${metaBlock}</head>`);
  }
  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', `<div id="root">${articleHtml}</div>`);
  }

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};

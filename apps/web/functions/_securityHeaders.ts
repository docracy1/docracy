/**
 * Security headers for every response that leaves the Pages Function layer. `_headers` only
 * applies to static assets, so responses built in Functions (SPA shell, 404 page, blog and
 * template SSR, the /api proxy) used to leave without HSTS, CSP or frame protection. The root
 * middleware runs for every request and finishes each response through applySecurityHeaders().
 *
 * HTML gets a Content Security Policy with a nonce per response instead of script-src
 * 'unsafe-inline'. The nonce goes on every <script> element of the document (HTMLRewriter), and
 * Cloudflare adds it to the scripts it injects at the edge (email obfuscation, bot management)
 * when the policy carries one. Other response types keep the policy a static rule set
 * (`_headers`) or the API worker gave them.
 */

/** 128 random bits, base64: one nonce per response. */
export function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export const PERMISSIONS_POLICY =
  "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()";

export const HSTS = "max-age=31536000; includeSubDomains; preload";

// Third-party script hosts: Turnstile, Microsoft Clarity and Google Analytics (both consent-gated).
const SCRIPT_HOSTS =
  "https://challenges.cloudflare.com https://www.clarity.ms https://scripts.clarity.ms https://www.googletagmanager.com";
const CONNECT_HOSTS =
  "https://challenges.cloudflare.com https://www.clarity.ms https://scripts.clarity.ms https://t.clarity.ms https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com";

/**
 * Policy for an HTML document. `embed` is the iframe signing page (/embed/*), which other sites
 * must be able to frame, so it gets `frame-ancestors *` and the smaller allow list from
 * `_headers`. style-src keeps 'unsafe-inline': the app renders inline style attributes
 * everywhere, and signature fonts load from Google Fonts on the signing page.
 */
export function buildCsp(nonce: string, opts: { embed?: boolean } = {}): string {
  if (opts.embed) {
    return [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://challenges.cloudflare.com",
      "frame-src 'self' https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors *",
    ].join("; ");
  }
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' ${SCRIPT_HOSTS}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${CONNECT_HOSTS}`,
    "frame-src 'self' https://challenges.cloudflare.com https://www.youtube-nocookie.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function isEmbedPath(pathname: string): boolean {
  return pathname === "/embed" || pathname.startsWith("/embed/");
}

/** True for a path that names a file (has an extension) but is not an HTML page. */
export function isNonHtmlFilePath(pathname: string): boolean {
  const m = /\.([a-z0-9]+)$/i.exec(pathname);
  if (!m) return false;
  const ext = m[1].toLowerCase();
  return ext !== "html" && ext !== "htm";
}

type Rewriter = { on(selector: string, handlers: { element(el: { setAttribute(n: string, v: string): void }): void }): Rewriter; transform(r: Response): Response };
declare const HTMLRewriter: new () => Rewriter;

/**
 * Finishes a response: common headers on everything, nonce CSP plus nonce attributes on HTML.
 * A 200 text/html body for a path that names a non-HTML file is the SPA fallback for a file
 * that does not exist (`/* /index.html 200` in `_redirects`), so it becomes a real 404.
 */
export function applySecurityHeaders(request: Request, response: Response, nonce: string): Response {
  const url = new URL(request.url);
  const contentType = response.headers.get("content-type") ?? "";
  const isHtml = contentType.includes("text/html");
  const embed = isEmbedPath(url.pathname);

  let out: Response;
  if (isHtml && response.status === 200 && isNonHtmlFilePath(url.pathname)) {
    out = new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=60" },
    });
  } else if (isHtml && response.body && typeof HTMLRewriter !== "undefined") {
    out = new HTMLRewriter()
      .on("script", {
        element(el) {
          el.setAttribute("nonce", nonce);
        },
      })
      .transform(response);
  } else {
    out = new Response(response.body, response);
  }

  const h = out.headers;
  h.set("Strict-Transport-Security", HSTS);
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Permissions-Policy", PERMISSIONS_POLICY);
  if (embed) {
    h.delete("X-Frame-Options");
  } else {
    h.set("X-Frame-Options", "DENY");
  }
  if (isHtml || out.status === 404) {
    h.set("Content-Security-Policy", buildCsp(nonce, { embed }));
  }
  return out;
}

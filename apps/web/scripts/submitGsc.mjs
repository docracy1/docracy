/**
 * Submits the sitemaps to Google Search Console after a deploy (Search Console API, sitemaps.submit).
 * Google does not take IndexNow; this is the supported way to tell it that a sitemap changed.
 *
 * Needs a Google Cloud service account with the Search Console API enabled, added as a Full user of
 * the docracy.io property (the owner's click). Its JSON key lives OUTSIDE the repository:
 *   ~/.config/docracy/gsc-service-account.json   (or GSC_SERVICE_ACCOUNT_FILE=/path/to/key.json)
 * Property: GSC_SITE; without it the domain property "sc-domain:docracy.io" is tried first, then the
 * URL-prefix property "https://docracy.io/".
 *
 * Without the key the script says so and exits 0: a missing key must never fail a deploy.
 * Run on its own: node scripts/submitGsc.mjs
 */
import { createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const KEY_FILE = process.env.GSC_SERVICE_ACCOUNT_FILE || join(homedir(), ".config", "docracy", "gsc-service-account.json");
const SITES = process.env.GSC_SITE ? [process.env.GSC_SITE] : ["sc-domain:docracy.io", "https://docracy.io/"];
const SITEMAPS = [
  "https://docracy.io/sitemap.xml",
  "https://api.docracy.io/api/blog-posts/sitemap.xml",
  "https://api.docracy.io/api/marketplace/sitemap.xml",
];
const SCOPE = "https://www.googleapis.com/auth/webmasters";

const b64url = (input) => Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

/** Signed JWT for the OAuth token exchange (RFC 7523), valid for one hour. */
export function serviceAccountJwt(key, now = Math.floor(Date.now() / 1000)) {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: key.token_uri || "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  return `${header}.${claims}.${b64url(signer.sign(key.private_key))}`;
}

async function main() {
  if (!existsSync(KEY_FILE)) {
    console.log(`[gsc] no service account key at ${KEY_FILE}, sitemaps not submitted to Google`);
    return;
  }
  const key = JSON.parse(readFileSync(KEY_FILE, "utf8"));
  const tokenRes = await fetch(key.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: serviceAccountJwt(key) }),
  });
  if (!tokenRes.ok) {
    console.log(`[gsc] token request failed: HTTP ${tokenRes.status}`);
    return;
  }
  const { access_token: token } = await tokenRes.json();
  for (const site of SITES) {
    let submitted = 0;
    for (const sitemap of SITEMAPS) {
      const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(sitemap)}`;
      const res = await fetch(url, { method: "PUT", headers: { authorization: `Bearer ${token}` } });
      // 204 = submitted. 403 usually means the service account is not a user of this property (or it does not exist).
      console.log(
        `[gsc] ${site} ${sitemap}: HTTP ${res.status}${res.ok ? " submitted" : res.status === 403 ? " (service account is not a user of this property)" : ""}`
      );
      if (res.ok) submitted++;
      else break;
    }
    if (submitted === SITEMAPS.length) return;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => console.log(`[gsc] skipped: ${e?.message ?? e}`));
}

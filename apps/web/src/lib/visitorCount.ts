/**
 * Browser half of the cookieless visitor count (apps/worker/src/lib/visitorCount.ts). Pure and without imports, so the
 * node tests (scripts/visitorCount.test.mjs) run it directly. No cookie, nothing in localStorage: the only thing kept
 * is the id of the current page view, in memory, to report how long the page was visible.
 */

/** Pages that are never reported: the signed-in app and every path that carries a token (mirror of the worker list). */
const UNTRACKED = [
  /^\/(sign|status|signed|embed|auth|team|dashboard|bulk-send|admin|api|account)(\/|$)/,
  /^\/es\/firmado(\/|$)/,
  /^\/(1099-season|income-proof)\/./,
  /^\/es\/(temporada-1099|constancia)\/./,
];

export function isUntrackedPath(path: string): boolean {
  return UNTRACKED.some((re) => re.test(path));
}

/** The browser's reasons not to send a view: Do Not Track, Global Privacy Control, automated browsers, local
 *  development, the operator's opt-out cookie and untracked pages. */
export function clientSkips(c: {
  path: string;
  host: string;
  cookie: string;
  doNotTrack?: string | null;
  gpc?: boolean;
  webdriver?: boolean;
}): boolean {
  if (!c.path.startsWith("/") || isUntrackedPath(c.path)) return true;
  if (c.host === "localhost" || c.host === "127.0.0.1" || c.host.endsWith(".local")) return true;
  if (/(?:^|;\s*)docracy_notrack=1(?:;|$)/.test(c.cookie)) return true;
  return c.doNotTrack === "1" || c.gpc === true || c.webdriver === true;
}

/** Counts the milliseconds a page is visible; `seconds()` is what goes to the worker when the page is left. */
export class VisibleTimer {
  private total = 0;
  private since: number | null;

  constructor(now: number, visible: boolean) {
    this.since = visible ? now : null;
  }

  show(now: number): void {
    if (this.since === null) this.since = now;
  }

  hide(now: number): void {
    if (this.since !== null) this.total += Math.max(0, now - this.since);
    this.since = null;
  }

  seconds(now: number): number {
    const running = this.since === null ? 0 : Math.max(0, now - this.since);
    return Math.round((this.total + running) / 1000);
  }
}

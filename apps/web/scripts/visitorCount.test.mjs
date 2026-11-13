import assert from "node:assert/strict";
import test from "node:test";
// Node 24 strips the types of this import-free TypeScript file on its own.
import { clientSkips, isUntrackedPath, VisibleTimer } from "../src/lib/visitorCount.ts";

const base = { path: "/", host: "docracy.io", cookie: "" };

test("visitor count: sends a plain public page view", () => {
  assert.equal(clientSkips(base), false);
  assert.equal(clientSkips({ ...base, path: "/free-templates/mutual-nda" }), false);
});

test("visitor count: respects Do Not Track, GPC, automation, local dev and the operator cookie", () => {
  assert.equal(clientSkips({ ...base, doNotTrack: "1" }), true);
  assert.equal(clientSkips({ ...base, gpc: true }), true);
  assert.equal(clientSkips({ ...base, webdriver: true }), true);
  assert.equal(clientSkips({ ...base, host: "localhost" }), true);
  assert.equal(clientSkips({ ...base, cookie: "a=b; docracy_notrack=1" }), true);
  assert.equal(clientSkips({ ...base, cookie: "docracy_notrack=0" }), false);
});

test("visitor count: never reports a token-bearing or signed-in path", () => {
  for (const p of ["/sign/tok", "/status/tok", "/signed/tok", "/es/firmado/tok", "/embed/sign/tok", "/dashboard", "/admin/analytics", "/1099-season/tok", "/es/constancia/tok"]) {
    assert.equal(isUntrackedPath(p), true, p);
    assert.equal(clientSkips({ ...base, path: p }), true, p);
  }
  assert.equal(isUntrackedPath("/1099-season"), false);
});

test("visitor count: counts only visible time", () => {
  const t = new VisibleTimer(0, true);
  t.hide(10_000);
  assert.equal(t.seconds(50_000), 10);
  t.show(60_000);
  assert.equal(t.seconds(65_400), 15);
  const hidden = new VisibleTimer(0, false);
  assert.equal(hidden.seconds(30_000), 0);
});

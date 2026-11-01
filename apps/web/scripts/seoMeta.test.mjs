import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(os.tmpdir(), `seoMeta-test-${process.pid}.cjs`);
buildSync({
  entryPoints: [path.join(__dirname, "../src/lib/seoMeta.ts")],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
});
const { ensureMetaDescription, normalizeSeoTitle } = createRequire(import.meta.url)(out);

const short = "Covers position, pay, work schedule, confidentiality, and termination terms for a new hire.";
const padded = ensureMetaDescription(short);
assert.ok(padded.length >= 120, `expected >= 120 chars, got ${padded.length}`);
assert.ok(padded.length <= 158, `expected <= 158 chars, got ${padded.length}`);
assert.match(padded, /Docracy/);
assert.ok(!padded.includes("—"), "no em dash in the padding sentence");

const long = "x".repeat(200);
assert.equal(ensureMetaDescription(long).length, 158);
assert.equal(ensureMetaDescription(long).endsWith("…"), true);

assert.equal(ensureMetaDescription(""), "");

// Titles: dash before the brand becomes a pipe, other dashes a colon.
assert.equal(normalizeSeoTitle("Prepare a document — Docracy"), "Prepare a document | Docracy");
assert.equal(
  normalizeSeoTitle("Docracy — Stop Chasing the Invoice. Get Paid on WhatsApp."),
  "Docracy: Stop Chasing the Invoice. Get Paid on WhatsApp."
);
assert.equal(normalizeSeoTitle("Free Business Document Templates | Docracy"), "Free Business Document Templates | Docracy");

// Over 60: the brand suffix goes first.
assert.equal(
  normalizeSeoTitle("HelloSign Alternative — Free for 2 Signers, No Account | Docracy"),
  "HelloSign Alternative: Free for 2 Signers, No Account"
);
// Still over 60: cut at the last clause separator.
assert.equal(
  normalizeSeoTitle("Alternativa a CitizenPath (2026) — documentos de apoyo, no formularios USCIS | Docracy"),
  "Alternativa a CitizenPath (2026): documentos de apoyo"
);
// No clause separator in the second half: cut at a word.
const words = normalizeSeoTitle("Word ".repeat(20).trim());
assert.ok(words.length <= 60 && !words.endsWith(" ") && words.startsWith("Word Word"));
for (const t of [
  "De Argentina a EE. UU. — plan LATAM $10: I-9, TAD Cancillería / Colegio de Escribanos, constancia | Docracy",
  "Garante Internacional para Arrendamiento — Renta en EE. UU. Sin Historial Crediticio | Docracy",
]) {
  const n = normalizeSeoTitle(t);
  assert.ok(n.length <= 60, `${n} (${n.length})`);
  assert.ok(!/[—–]/.test(n));
}

// Function words are dropped from a cut inside a clause.
assert.equal(normalizeSeoTitle("Docracy for Pipefy Partners Everywhere Turn an Approval Phase Into a Real"), "Docracy for Pipefy Partners Everywhere Turn an Approval");
assert.equal(normalizeSeoTitle("Cómo funciona esta herramienta de firma: documentos en menos de un minuto más"), "Cómo funciona esta herramienta de firma");

fs.unlinkSync(out);
console.log("seoMeta.test.mjs: ok");

/**
 * Adds English voiceover to the WhatsApp-signing demo webm using edge-tts,
 * timed to public/videos/whatsapp-signing.en.vtt.
 *
 * Prerequisites: ffmpeg, `pip install edge-tts`
 * Run from repo root: node apps/web/scripts/narrate-whatsapp-signing.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const videoPath = path.join(root, "apps/web/public/videos/whatsapp-signing.webm");
const vttPath = path.join(root, "apps/web/public/videos/whatsapp-signing.en.vtt");
const voice = process.env.DOCRACY_TTS_VOICE || "en-US-JennyNeural";

function parseVtt(text) {
  const cues = [];
  const blocks = text.replace(/\r/g, "").split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    if (!lines.length || lines[0] === "WEBVTT") continue;
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;
    const [startRaw, endRaw] = timeLine.split("-->").map((s) => s.trim());
    const textLines = lines.slice(lines.indexOf(timeLine) + 1);
    cues.push({
      start: parseTs(startRaw),
      end: parseTs(endRaw),
      text: textLines.join(" ").replace(/\s+/g, " ").trim(),
    });
  }
  return cues;
}

function parseTs(ts) {
  // 00:05.000 or 00:00:05.000
  const parts = ts.split(":");
  let h = 0,
    m = 0,
    s = 0;
  if (parts.length === 3) {
    h = Number(parts[0]);
    m = Number(parts[1]);
    s = Number(parts[2]);
  } else {
    m = Number(parts[0]);
    s = Number(parts[1]);
  }
  return h * 3600 + m * 60 + s;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => {
      err += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} failed (${code}): ${err.slice(-500)}`));
    });
  });
}

async function tts(text, outMp3) {
  const edge = process.env.HOME + "/.local/bin/edge-tts";
  const bin = fs.existsSync(edge) ? edge : "edge-tts";
  await run(bin, ["--voice", voice, "--rate", "+5%", "--text", text, "--write-media", outMp3]);
}

async function main() {
  if (!fs.existsSync(videoPath)) throw new Error(`missing ${videoPath}`);
  if (!fs.existsSync(vttPath)) throw new Error(`missing ${vttPath}`);

  const cues = parseVtt(fs.readFileSync(vttPath, "utf8"));
  if (!cues.length) throw new Error("no VTT cues");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "wa-narrate-"));
  const segmentPaths = [];
  const filterParts = [];
  const inputArgs = [];

  console.log(`Voice: ${voice}`);
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const mp3 = path.join(tmp, `cue-${i}.mp3`);
    console.log(`  [${cue.start.toFixed(1)}s] ${cue.text.slice(0, 70)}…`);
    await tts(cue.text, mp3);
    // Convert to wav for predictable ffmpeg adelay/amix
    const wav = path.join(tmp, `cue-${i}.wav`);
    await run("ffmpeg", ["-y", "-i", mp3, "-ar", "48000", "-ac", "1", wav]);
    segmentPaths.push(wav);
    inputArgs.push("-i", wav);
    const delayMs = Math.round(cue.start * 1000);
    // adelay for mono needs one value; pad end so amix length matches video
    filterParts.push(`[${i + 1}:a]adelay=${delayMs}|${delayMs},apad[a${i}]`);
  }

  const mixInputs = cues.map((_, i) => `[a${i}]`).join("");
  const filter = `${filterParts.join(";")};${mixInputs}amix=inputs=${cues.length}:dropout_transition=0:normalize=0[aout]`;

  const voiced = path.join(tmp, "voiced.webm");
  await run("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    ...inputArgs,
    "-filter_complex",
    filter,
    "-map",
    "0:v",
    "-map",
    "[aout]",
    "-c:v",
    "copy",
    "-c:a",
    "libopus",
    "-b:a",
    "96k",
    "-shortest",
    voiced,
  ]);

  fs.copyFileSync(voiced, videoPath);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`✓ Narration muxed → ${videoPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

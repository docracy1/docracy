import { Hono } from "hono";
import { sendFeedback } from "../lib/email";
import { checkFeedbackRateLimit } from "../lib/ratelimit";
import { answerSupportQuestion } from "../lib/support";
import type { Env } from "@docracy/shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 4000;

const feedback = new Hono<{ Bindings: Env }>();

feedback.post("/", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (!(await checkFeedbackRateLimit(c.env, ip))) {
    return c.json({ error: "Too many messages sent recently. Please try again later." }, 429);
  }

  let body: { email?: string; message?: string };
  try {
    body = await c.req.json<{ email?: string; message?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!EMAIL_RE.test(email)) {
    return c.json({ error: "That doesn't look like a valid email address" }, 400);
  }
  if (!message) {
    return c.json({ error: "Please include a message" }, 400);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return c.json({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters` }, 400);
  }

  // AI-first triage: try to answer instantly from known product facts before ever bothering the
  // founder. answerSupportQuestion never throws and returns null for anything it isn't confident
  // about (or if no API key is configured), so this always falls back to the original
  // email-the-founder behavior — nothing here can make a submission go unanswered.
  const aiAnswer = await answerSupportQuestion(c.env, message);
  if (aiAnswer) {
    return c.json({ ok: true, aiAnswer });
  }

  await sendFeedback(c.env, email, message);

  return c.json({ ok: true });
});

export default feedback;

import { Hono } from "hono";
import { sendFeedback } from "../lib/email";
import { checkFeedbackRateLimit } from "../lib/ratelimit";
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

  await sendFeedback(c.env, email, message);

  return c.json({ ok: true });
});

export default feedback;

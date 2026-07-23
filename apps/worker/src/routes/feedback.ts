import { Hono } from "hono";
import { sendFeedback } from "../lib/email";
import { checkFeedbackRateLimit } from "../lib/ratelimit";
import { answerSupportQuestion } from "../lib/support";
import { optionalAccount, type AccountContext } from "../lib/auth";
import type { Env } from "@docracy/shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 4000;

type Variables = { account: AccountContext | null };
const feedback = new Hono<{ Bindings: Env; Variables: Variables }>();

feedback.post("/", optionalAccount, async (c) => {
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

  // AI-first triage is a paid-plan perk: only attempt it for a signed-in paid account. Free and
  // anonymous submissions (the vast majority of traffic) skip straight to emailing the founder,
  // exactly as before this feature existed. answerSupportQuestion never throws and returns null
  // for anything it isn't confident about, so this always falls back safely either way.
  const account = c.get("account");
  if (account?.isPaid) {
    const aiAnswer = await answerSupportQuestion(c.env, message);
    if (aiAnswer) {
      return c.json({ ok: true, aiAnswer });
    }
  }

  await sendFeedback(c.env, email, message);

  return c.json({ ok: true });
});

export default feedback;

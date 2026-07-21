import { useState } from "react";
import { submitFeedback } from "../lib/api";

export default function FeedbackForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitFeedback(email, message);
      setAiAnswer(res.aiAnswer ?? null);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 56 }}>
      <h3 style={{ fontSize: 15 }}>Questions, bugs, feedback?</h3>
      <p>Send it straight to me — no account needed.</p>

      {sent ? (
        aiAnswer ? (
          <div>
            <p style={{ marginBottom: 8, fontWeight: 600 }}>Here's an instant answer:</p>
            <p style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}>{aiAnswer}</p>
            <p style={{ fontSize: 13, color: "var(--mute)", marginBottom: 0 }}>
              Didn't answer your question?{" "}
              <a
                href={`mailto:founder@docracy.io?subject=${encodeURIComponent(
                  `Follow-up: ${message.slice(0, 60)}`
                )}&body=${encodeURIComponent(message)}`}
              >
                Email us directly
              </a>
              .
            </p>
          </div>
        ) : (
          <p style={{ color: "var(--success)", marginBottom: 0 }}>Thanks — got it.</p>
        )
      ) : (
        <form onSubmit={onSubmit}>
          <input
            className="form-input"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 12 }}
          />
          <textarea
            className="form-textarea"
            placeholder="What's on your mind"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            style={{ width: "100%", marginBottom: 12, resize: "vertical" }}
          />
          {error && (
            <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>
          )}
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}

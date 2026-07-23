import { useState } from "react";
import { requestMagicLink } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await requestMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="container">
        <h1>Check your email</h1>
        <p>
          We sent a sign-in link to {email}. It expires in 15 minutes and only works once.
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Sign in</h1>
      <p>No password — we'll email you a link.</p>
      <form onSubmit={onSubmit}>
        <input
          className="form-input"
          type="email"
          placeholder="you@email.com"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", maxWidth: 360, marginBottom: 12, display: "block" }}
        />
        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send sign-in link"}
        </button>
      </form>
    </div>
  );
}

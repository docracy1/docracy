import { useState } from "react";
import { adminLogin, requestMagicLink } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSubmitting(true);
    setPasswordError(null);
    try {
      await adminLogin(email, password);
      window.location.href = "/dashboard";
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPasswordSubmitting(false);
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
      <p>No password — we'll email you a link. First time here? This creates your account too.</p>
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

      <button
        type="button"
        onClick={() => setShowPasswordLogin((v) => !v)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          marginTop: 16,
          fontSize: 13,
          color: "var(--mute)",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {showPasswordLogin ? "Hide password sign-in" : "Sign in with a password instead"}
      </button>

      {showPasswordLogin && (
        <form onSubmit={onPasswordSubmit} style={{ marginTop: 12 }}>
          <input
            className="form-input"
            type="password"
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", maxWidth: 360, marginBottom: 12, display: "block" }}
          />
          {passwordError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{passwordError}</p>}
          <button className="btn-secondary" type="submit" disabled={passwordSubmitting}>
            {passwordSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}
    </div>
  );
}

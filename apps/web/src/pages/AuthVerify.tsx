import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { consumeMagicLinkToken } from "../lib/api";

export default function AuthVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Missing sign-in token.");
      return;
    }
    // Scrub the token out of the URL bar/history immediately — it's a bearer credential and
    // shouldn't linger in browser history or get sent as a Referer to any third-party resource.
    window.history.replaceState({}, "", "/auth/verify");
    consumeMagicLinkToken(token)
      .then(() => navigate("/dashboard", { replace: true }))
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
  }, []);

  if (error) {
    return (
      <div className="container">
        <h1>Sign-in failed</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <p>Signing you in…</p>
    </div>
  );
}

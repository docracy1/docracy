import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useT } from "../lib/i18n";
import { consumeMagicLinkToken } from "../lib/api";
import { useNoIndex } from "../lib/useNoIndex";

function safeClientNext(next: string | undefined): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  if (next.includes("://") || next.includes("\\")) return "/dashboard";
  return next;
}

export default function AuthVerify() {
  useNoIndex();
  const t = useT();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError(t("auth.missingToken"));
      return;
    }
    // Scrub the token out of the URL bar/history immediately — it's a bearer credential and
    // shouldn't linger in browser history or get sent as a Referer to any third-party resource.
    window.history.replaceState({}, "", "/auth/verify");
    consumeMagicLinkToken(token)
      .then((result) => navigate(safeClientNext(result.next), { replace: true }))
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
  }, []);

  if (error) {
    return (
      <div className="container">
        <h1>{t("auth.failed")}</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <p>{t("auth.signingIn")}</p>
    </div>
  );
}

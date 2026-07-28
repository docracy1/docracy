import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { resolveEmbedSession } from "../lib/api";
import { useNoIndex } from "../lib/useNoIndex";
import Sign from "./Sign";

function parentOrigin(): string | null {
  const ancestors = (window.location as Location & { ancestorOrigins?: DOMStringList }).ancestorOrigins;
  if (ancestors && ancestors.length > 0) return ancestors[0];
  if (document.referrer) {
    try {
      return new URL(document.referrer).origin;
    } catch {
      return null;
    }
  }
  return null;
}

export default function EmbedSign() {
  useNoIndex();
  const { token } = useParams<{ token: string }>();
  const [signToken, setSignToken] = useState<string | null>(null);
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([]);
  const [returnUrl, setReturnUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing embed token");
      return;
    }
    resolveEmbedSession(token)
      .then((session) => {
        const framed = window.self !== window.top;
        if (framed) {
          const origin = parentOrigin();
          if (!origin || !session.allowedOrigins.includes(origin)) {
            setError("This signing page cannot be embedded from this origin.");
            return;
          }
        }
        setAllowedOrigins(session.allowedOrigins);
        setReturnUrl(session.returnUrl);
        setSignToken(session.signToken);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
  }, [token]);

  if (error) {
    return (
      <div className="container">
        <h1>Not available</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!signToken) {
    return (
      <div className="container">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <Sign
      overrideToken={signToken}
      embedMode
      allowedOrigins={allowedOrigins}
      returnUrl={returnUrl}
    />
  );
}

import { Link, useLocation } from "react-router-dom";

export default function PrepareSent() {
  const { state } = useLocation() as {
    state: { docId: string; statusToken: string; signingMode?: "sequential" | "parallel" } | null;
  };

  if (!state) {
    return (
      <div className="container">
        <h1>Sent</h1>
        <p>Your document was created. Check your email for status updates.</p>
        <Link to="/" className="btn-secondary" style={{ textDecoration: "none" }}>
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>On its way</h1>
      <p>
        {state.signingMode === "parallel"
          ? "Every signer has been emailed their link — they can sign in any order."
          : "The first signer has been emailed their link. Everyone else in the chain will be notified in turn."}
      </p>
      <div className="card">
        <p style={{ marginBottom: 8 }}>Bookmark this link to check progress any time:</p>
        <Link to={`/status/${state.statusToken}`}>
          {window.location.origin}/status/{state.statusToken}
        </Link>
      </div>
    </div>
  );
}

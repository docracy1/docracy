import { Component, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/** Top-level safety net around every route: without this, an uncaught render error anywhere in
 *  the tree unmounts the entire app to a blank white page with no visible signal of what went
 *  wrong — this shows the actual error message instead, and keeps it from taking down routes that
 *  didn't crash (the error still only replaces the reachable render, not the whole document). */
export default class RootErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    // eslint-disable-next-line no-console
    console.error("RootErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container">
          <h1>Something went wrong</h1>
          <p>This page hit an unexpected error. Reloading usually fixes it.</p>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "var(--danger)", background: "var(--canvas-soft)", padding: 12, borderRadius: 8 }}>
            {this.state.error.message}
          </pre>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

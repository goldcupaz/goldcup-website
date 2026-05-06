import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Gold Cup]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="shell" style={{ padding: 24 }}>
          <h1 className="page-title">Something went wrong</h1>
          <p className="muted">
            {this.state.error.message}
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            Open the browser console (F12 → Console) for details. After changing code, save and refresh the page.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Paints a fatal error directly into the DOM so a crashed webview shows the
 * actual error instead of a silent blank screen.
 */
export function showFatalError(title: string, detail: string): void {
  console.error(`${title}: ${detail}`);
  try {
    let overlay = document.getElementById("dbchart-fatal-error");
    if (!overlay) {
      overlay = document.createElement("pre");
      overlay.id = "dbchart-fatal-error";
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:99999;overflow:auto;margin:0;padding:12px;" +
        "background:#1e1e1e;color:#f48771;font-family:monospace;font-size:12px;white-space:pre-wrap";
      document.body.appendChild(overlay);
    }
    overlay.textContent += `${title}\n\n${detail}\n\n${"─".repeat(60)}\n\n`;
  } catch {
    // Nothing more we can do if even the DOM is broken.
  }
}

/** Install window-level traps for uncaught errors and rejections. */
export function installGlobalErrorReporting(): void {
  window.addEventListener("error", (event) => {
    const stack = event.error?.stack ? `\n\n${event.error.stack}` : "";
    showFatalError(
      "Webview error",
      `${event.message}\n${event.filename}:${event.lineno}:${event.colno}${stack}`
    );
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as { stack?: string; message?: string } | undefined;
    showFatalError("Unhandled rejection", reason?.stack ?? reason?.message ?? String(event.reason));
  });
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Keeps a component crash contained: instead of React unmounting the whole
 * tree (blank screen), the error is rendered in place.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    showFatalError("UI crashed (React)", `${error.stack ?? error.message}\n\nComponent stack:\n${info.componentStack ?? ""}`);
  }

  render() {
    if (this.state.error) {
      return (
        <pre
          style={{
            margin: 0,
            padding: 12,
            color: "#f48771",
            background: "#1e1e1e",
            fontFamily: "monospace",
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {`UI crashed: ${this.state.error.message}\n\n${this.state.error.stack ?? ""}`}
        </pre>
      );
    }
    return this.props.children;
  }
}

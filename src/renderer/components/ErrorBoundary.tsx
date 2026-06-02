import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error?: Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Renderer error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex h-screen flex-col items-center justify-center gap-3 bg-neutral-950 px-6 text-center text-white">
          <h1 className="text-base font-semibold">LyricSheet hit a renderer error</h1>
          <p className="max-w-sm text-sm text-white/58">
            {this.state.error.message || "The window failed to render."}
          </p>
        </main>
      );
    }

    return this.props.children;
  }
}

// src/components/ErrorBoundary.tsx
// Catches React rendering errors and prevents blank/black screens

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare props: Props;

  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-dark-surface flex items-center justify-center p-8">
            <div className="max-w-2xl w-full text-left">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-signal/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-rose-signal-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-dark-text-bright mb-2 text-center">Application Error</h2>
              <div className="bg-dark-panel border border-dark-panel-soft rounded-lg p-4 mb-6 overflow-auto max-h-64">
                <p className="text-rose-signal-strong font-mono text-sm mb-2">{this.state.error?.message}</p>
                <pre className="text-dark-muted-strong text-xs whitespace-pre-wrap break-all">{this.state.error?.stack}</pre>
              </div>
              <div className="text-center space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-cyan-signal-deep hover:bg-cyan-signal-muted text-dark-text-bright rounded-lg font-medium transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => super.setState({ hasError: false, error: null })}
                  className="px-6 py-2 bg-dark-panel-soft hover:bg-dark-border text-dark-text-bright rounded-lg font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

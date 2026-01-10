"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback component */
  fallback?: React.ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Variant for styling: default, inline, or minimal */
  variant?: "default" | "inline" | "minimal";
  /** Custom reset handler */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch and handle React errors gracefully.
 * Prevents full page crashes from component failures.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Check for explicit fallback prop (including null, which means "render nothing")
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          variant={this.props.variant}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  variant?: "default" | "inline" | "minimal";
  onRetry?: () => void;
}

function ErrorFallback({ error, variant = "default", onRetry }: ErrorFallbackProps) {
  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertTriangle className="w-4 h-4" />
        <span>Something went wrong</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 p-4 rounded-lg",
          "bg-destructive/10 border border-destructive/20"
        )}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="font-medium text-destructive">Something went wrong</p>
            {error && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {error.message}
              </p>
            )}
          </div>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Default: centered card
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        "rounded-xl border bg-card"
      )}
    >
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>

      <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>

      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        We encountered an unexpected error. Please try again, or refresh the page if the problem persists.
      </p>

      {error && process.env.NODE_ENV === "development" && (
        <pre className="text-xs text-left bg-muted p-3 rounded-lg mb-4 max-w-full overflow-auto">
          {error.message}
        </pre>
      )}

      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Higher-order component to wrap a component with an error boundary.
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  const componentName = Component.displayName || Component.name || "Component";
  WrappedComponent.displayName = "withErrorBoundary(" + componentName + ")";

  return WrappedComponent;
}

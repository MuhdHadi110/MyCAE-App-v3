import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Bug } from 'lucide-react';
import { Button } from './ui/Button';
import { logger } from '../lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Error handler callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Show detailed error info */
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showStack: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log error for debugging
    logger.error('Error caught by ErrorBoundary:', error);
    logger.error('Component stack:', errorInfo.componentStack);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleStack = () => {
    this.setState((prev) => ({ showStack: !prev.showStack }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = import.meta.env.DEV;
      const { error, errorInfo, showStack } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-lg w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-red-200 dark:border-red-800/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Something went wrong</h1>
                    <p className="text-red-100 text-sm mt-0.5">
                      An unexpected error has occurred
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We're sorry, but something unexpected happened. You can try refreshing the page
                  or return to the dashboard. If the problem persists, please contact support.
                </p>

                {/* Error details (dev mode) */}
                {isDev && error && (
                  <div className="mb-6">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Bug className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-red-800 dark:text-red-300 text-sm">
                            {error.name}: {error.message}
                          </p>
                        </div>
                      </div>

                      {errorInfo && (
                        <button
                          onClick={this.toggleStack}
                          className="mt-3 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        >
                          {showStack ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          {showStack ? 'Hide' : 'Show'} component stack
                        </button>
                      )}

                      {showStack && errorInfo && (
                        <pre className="mt-3 p-3 bg-gray-900 text-gray-100 text-xs rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
                          {errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={this.handleReset}
                    icon={<RefreshCw className="w-4 h-4" />}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={() => {
                      window.location.href = '/';
                    }}
                    icon={<Home className="w-4 h-4" />}
                  >
                    Go to Dashboard
                  </Button>
                </div>

                {/* Reload option */}
                <button
                  onClick={this.handleReload}
                  className="mt-4 w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Or reload the entire page
                </button>
              </div>
            </div>

            {/* Footer hint */}
            <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
              Error ID: {Date.now().toString(36).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for ErrorBoundary with hooks support
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;

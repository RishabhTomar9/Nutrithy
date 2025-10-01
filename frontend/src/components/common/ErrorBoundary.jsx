import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      maxRetries: 3
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // TODO: Add error reporting service here
    // reportError(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.state.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          canRetry={this.state.retryCount < this.state.maxRetries}
          retryCount={this.state.retryCount}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, onRetry, canRetry, retryCount }) {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-gray-700">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-3">
          Oops! Something went wrong
        </h1>
        
        <p className="text-gray-300 mb-6">
          We're sorry, but something unexpected happened. Don't worry, it's not your fault!
        </p>


        <div className="space-y-3">
          {canRetry ? (
            <button
              onClick={onRetry}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              aria-label={`Try again (attempt ${retryCount + 1})`}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again {retryCount > 0 && `(${retryCount}/3)`}
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              aria-label="Reload page"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          )}
          
          <button
            onClick={goHome}
            className="w-full bg-gray-700 text-gray-200 py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 border border-gray-600"
            aria-label="Go to home page"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}

export default ErrorBoundary;

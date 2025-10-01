import React, { Suspense, useCallback, useEffect, useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// Import layout utilities
import './styles/layout-utils.css';

// Core hooks and utilities
import { useAuth } from './hooks/useAuth';
import { useSidebar } from './hooks/useSidebar';
import axiosInstance from './utils/axiosInstance';
import { navigationFix } from './utils/navigationFix';
import navigationTest from './utils/navigationTest';
import healthDataService from './services/healthDataService';

// Components
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingFallback, { SuspenseBoundary } from './components/common/LoadingFallback';
import Navbar from './components/common/Navbar';
// import Breadcrumb from './components/common/Breadcrumb';
import Footer from './components/common/Footer';
import ThreadBackground from './components/common/ThreadBackground';
import PageTransition from './components/common/PageTransition';

// Route configuration
import { routeConfig, getRouteConfig, updatePageMeta } from './config/routes';

/**
 * Enhanced Protected Route Component with accessibility and error handling
 */
const ProtectedRoute = React.memo(({ user, children }) => {
  const location = useLocation();
  
  if (!user) {
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ from: location.pathname }}
        aria-label="Redirecting to login page"
      />
    );
  }
  return children;
});

/**
 * Profile completion checker with improved error handling and caching
 */
function RequireCompletedProfile({ children }) {
  const [state, setState] = useState({
    checking: true,
    completed: false,
    error: null,
    retryCount: 0
  });

  const checkProfileCompletion = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/users/me');
      setState(prev => ({
        ...prev,
        checking: false,
        completed: !!data.profileCompleted,
        error: null
      }));
    } catch (error) {
      console.error('Profile completion check failed:', error);
      setState(prev => ({
        ...prev,
        checking: false,
        completed: false,
        error: error.message,
        retryCount: prev.retryCount + 1
      }));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const performCheck = async () => {
      if (!isMounted) return;
      await checkProfileCompletion();
    };
    
    performCheck();
    
    return () => {
      isMounted = false;
    };
  }, [checkProfileCompletion]);

  if (state.checking) {
    return (
      <LoadingFallback 
        message="Verifying profile..." 
        size="default"
      />
    );
  }

  if (state.error && state.retryCount < 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">Profile check failed</p>
          <button 
            onClick={checkProfileCompletion}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Retry profile verification"
          >
            Retry ({state.retryCount}/3)
          </button>
        </div>
      </div>
    );
  }

  if (!state.completed) {
    return (
      <Navigate 
        to="/register-profile" 
        replace 
        aria-label="Redirecting to profile completion"
      />
    );
  }

  return children;
}

/**
 * Dynamic Route Component with lazy loading and error boundaries
 */
const DynamicRoute = React.memo(({ route, user }) => {
  const Component = route.element;
  const routeName = route.path.split('/')[1] || 'home';

  let element = (
    <SuspenseBoundary routeName={routeName}>
      <PageTransition>
        <Component />
      </PageTransition>
    </SuspenseBoundary>
  );

  // Apply profile requirement wrapper
  if (route.requiresProfile) {
    element = (
      <RequireCompletedProfile>
        {element}
      </RequireCompletedProfile>
    );
  }

  // Apply authentication wrapper
  if (route.requiresAuth) {
    element = (
      <ProtectedRoute user={user}>
        {element}
      </ProtectedRoute>
    );
  }

  // Handle redirect for authenticated users
  if (route.redirectIfAuthenticated && user) {
    return <Navigate to={route.redirectIfAuthenticated} replace />;
  }

  return element;
});

/**
 * Main App Component with enhanced architecture
 */
/**
 * Router-level Error Boundary that doesn't use Router hooks
 */
class RouterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Router-level error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 text-center border border-gray-700/50 shadow-2xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              Application Error
            </h2>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              The application encountered a critical error. Please reload the page to continue.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <RouterErrorBoundary>
      <Router>
        <ErrorBoundary>
          <AppContent />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </ErrorBoundary>
      </Router>
    </RouterErrorBoundary>
  );
}

/**
 * App Content with routing logic
 */
function AppContent() {
  const { user, loading } = useAuth();
  const { mainMargin, isMobile } = useSidebar();
  const location = useLocation();
  
  // Initialize health service and check for redirect results
  useEffect(() => {
    let isMounted = true;
    
    const initializeHealthService = async () => {
      if (!isMounted) return;
      
      try {
        // Check for Google OAuth redirect result
        const result = await healthDataService.checkRedirectResult();
        if (result) {
          console.log('Google Fit connected successfully after redirect');
        }
      } catch (error) {
        console.error('Error initializing health service:', error);
      }
    };
    
    initializeHealthService();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Initialize navigation fix
  useEffect(() => {
    navigationFix.debugNavigation();
    navigationFix.fixReactRouterV7Navigation();
    
    // Run navigation tests in development mode
    if (import.meta.env.DEV) {
      setTimeout(() => {
        navigationTest.runAllTests().catch(console.error);
      }, 2000);
    }
  }, [location]);

  // Update page metadata when route changes
  useEffect(() => {
    const currentRoute = getRouteConfig(location.pathname);
    if (currentRoute) {
      updatePageMeta(currentRoute);
    }
  }, [location.pathname]);

  // Memoize routes to prevent unnecessary re-renders
  const routes = useMemo(() => {
    return routeConfig.map((route) => (
      <Route
        key={route.path}
        path={route.path}
        element={<DynamicRoute route={route} user={user} />}
      />
    ));
  }, [user]);

  if (loading) {
    return (
      <LoadingFallback 
        message="Initializing Nutrithy..." 
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 transition-all"
      >
        Skip to main content
      </a>
      
      <Navbar />
      <main 
        id="main-content"
        className={`flex-1 relative transition-all duration-300 scroll-smooth min-h-screen ${
          user ? 'pt-44 lg:pt-20 pb-20' : 'pt-20 pb-20'
        }`}
        style={{ 
          marginLeft: user && !isMobile ? `${mainMargin}px` : 0,
          paddingBottom: user ? '8rem' : '2rem' // Extra space for footer
        }}
        role="main"
        tabIndex={-1}
      >
        <ThreadBackground />
        <div className="relative z-10 min-h-[calc(100vh-12rem)]">
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              {routes}
              <Route 
                path="*" 
                element={
                  <Navigate 
                    to="/" 
                    replace 
                    aria-label="Redirecting to home page"
                  />
                } 
              />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
      
      {user && (
          <Footer />
      )}
      
    </div>
  );
}

// Performance optimization: prevent unnecessary re-renders
AppContent.displayName = 'AppContent';
ProtectedRoute.displayName = 'ProtectedRoute';
DynamicRoute.displayName = 'DynamicRoute';

export default App;

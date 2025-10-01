import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingFallback from './LoadingFallback';

export default function RouteGuard({ children, requiresAuth = false, requiresProfile = false, redirectIfAuthenticated = null }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure auth state is properly loaded
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while auth is being determined
  if (loading || !isReady) {
    return <LoadingFallback message="Checking authentication..." />;
  }

  // Redirect authenticated users away from auth pages
  if (redirectIfAuthenticated && user) {
    return <Navigate to={redirectIfAuthenticated} replace />;
  }

  // Redirect unauthenticated users to login
  if (requiresAuth && !user) {
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ from: location.pathname }}
      />
    );
  }

  // Check profile completion if required
  if (requiresProfile && user && !user.profileCompleted) {
    return <Navigate to="/register-profile" replace />;
  }

  return children;
}

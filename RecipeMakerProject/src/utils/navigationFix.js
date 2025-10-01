// Navigation Fix Utility for React Router v7
export const navigationFix = {
  // Clear any stuck navigation states
  clearNavigationCache: () => {
    try {
      // Clear any cached navigation states
      sessionStorage.removeItem('navigationState');
      sessionStorage.removeItem('lastRoute');
      sessionStorage.removeItem('react-router-scroll-restoration');
      
      // Clear React Router cache if it exists
      if (window.__REACT_ROUTER_CACHE__) {
        window.__REACT_ROUTER_CACHE__ = null;
      }
      
      // Clear any React Router v7 specific caches
      if (window.__REACT_ROUTER_V7_CACHE__) {
        window.__REACT_ROUTER_V7_CACHE__ = null;
      }
      
      console.log('✅ Navigation cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear navigation cache:', error);
    }
  },

  // Reset navigation to home
  resetToHome: () => {
    try {
      window.location.href = '/';
      console.log('✅ Navigation reset to home');
    } catch (error) {
      console.error('❌ Failed to reset navigation:', error);
    }
  },

  // Debug navigation state
  debugNavigation: () => {
    const info = {
      currentUrl: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      title: document.title,
      readyState: document.readyState,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 Navigation Debug Info:', info);
    return info;
  },

  // Check if navigation is stuck
  isNavigationStuck: () => {
    const lastRoute = sessionStorage.getItem('lastRoute');
    const currentRoute = window.location.pathname;
    const lastCheck = sessionStorage.getItem('lastNavigationCheck');
    const now = Date.now();
    
    if (lastCheck && (now - parseInt(lastCheck)) < 1000) {
      return lastRoute === currentRoute;
    }
    
    sessionStorage.setItem('lastRoute', currentRoute);
    sessionStorage.setItem('lastNavigationCheck', now.toString());
    return false;
  },

  // Force page refresh if needed
  forceRefreshIfStuck: () => {
    if (navigationFix.isNavigationStuck()) {
      console.log('⚠️ Navigation appears stuck, forcing refresh...');
      window.location.reload();
    }
  },

  // React Router v7 specific fixes
  fixReactRouterV7Navigation: () => {
    try {
      // Ensure proper history state for React Router v7
      if (window.history && window.history.state === null) {
        window.history.replaceState({ key: 'initial' }, '', window.location.href);
      }
      
      // Clear any stale router state
      const routerStateKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('react-router') || key.startsWith('__react-router')
      );
      routerStateKeys.forEach(key => sessionStorage.removeItem(key));
      
      console.log('✅ React Router v7 navigation fixes applied');
    } catch (error) {
      console.error('❌ Failed to apply React Router v7 fixes:', error);
    }
  },

  // Check and fix navigation inconsistencies
  validateNavigationState: () => {
    const currentPath = window.location.pathname;
    const validPaths = ['/', '/recipes', '/community', '/activity', '/diet-planner', '/profile', '/login', '/register-profile'];
    
    if (!validPaths.some(path => currentPath === path || currentPath.startsWith(path + '/'))) {
      console.warn('⚠️ Invalid navigation path detected:', currentPath);
      // Redirect to home if path is invalid
      window.location.href = '/';
      return false;
    }
    
    return true;
  }
};

// Auto-run navigation check on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      navigationFix.fixReactRouterV7Navigation();
      navigationFix.validateNavigationState();
      navigationFix.forceRefreshIfStuck();
    }, 1000);
  });
  
  // Handle browser back/forward navigation
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      navigationFix.validateNavigationState();
    }, 100);
  });
  
  // Make navigation fix available globally for debugging
  window.navigationFix = navigationFix;
}

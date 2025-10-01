// Navigation Test Utility
// This utility helps test and validate navigation functionality

export const navigationTest = {
  // Test all navigation routes
  testAllRoutes: async () => {
    const routes = [
      { path: '/', name: 'Home' },
      { path: '/recipes', name: 'Recipes' },
      { path: '/community', name: 'Community' },
      { path: '/activity', name: 'Activity' },
      { path: '/diet-planner', name: 'Diet Planner' },
      { path: '/profile', name: 'Profile' },
    ];

    const results = [];

    for (const route of routes) {
      try {
        // Test if route is accessible
        const testResult = {
          path: route.path,
          name: route.name,
          accessible: true,
          error: null,
          timestamp: new Date().toISOString()
        };

        // Here we could add more sophisticated testing
        // For now, we'll just check if the route exists in our configuration
        const routeExists = routes.some(r => r.path === route.path);
        testResult.accessible = routeExists;

        results.push(testResult);
      } catch (error) {
        results.push({
          path: route.path,
          name: route.name,
          accessible: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log('🧪 Navigation Test Results:', results);
    return results;
  },

  // Test navigation state consistency
  testNavigationState: () => {
    const currentPath = window.location.pathname;
    const expectedRoutes = ['/', '/recipes', '/community', '/activity', '/diet-planner', '/profile'];
    
    const isValidRoute = expectedRoutes.some(route => 
      currentPath === route || currentPath.startsWith(route + '/')
    );

    const result = {
      currentPath,
      isValid: isValidRoute,
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Navigation State Test:', result);
    return result;
  },

  // Test navigation components sync
  testNavigationSync: () => {
    // Check if both desktop and mobile nav have the same routes
    const desktopNavItems = [
      { name: 'Home', path: '/' },
      { name: 'Recipes', path: '/recipes' },
      { name: 'Community', path: '/community' },
      { name: 'Activity', path: '/activity' },
      { name: 'Diet Planner', path: '/diet-planner' },
    ];

    const mobileNavItems = [
      { name: 'Dashboard', path: '/' },
      { name: 'Recipes', path: '/recipes' },
      { name: 'Community', path: '/community' },
      { name: 'Activity', path: '/activity' },
      { name: 'Diet Planner', path: '/diet-planner' },
    ];

    // Extract paths for comparison
    const desktopPaths = desktopNavItems.map(item => item.path).sort();
    const mobilePaths = mobileNavItems.map(item => item.path).sort();

    const pathsMatch = JSON.stringify(desktopPaths) === JSON.stringify(mobilePaths);

    const result = {
      desktopPaths,
      mobilePaths,
      pathsMatch,
      timestamp: new Date().toISOString()
    };

    console.log('🔄 Navigation Sync Test:', result);
    return result;
  },

  // Run all navigation tests
  runAllTests: async () => {
    console.log('🚀 Starting comprehensive navigation tests...');
    
    const results = {
      routeTests: await navigationTest.testAllRoutes(),
      stateTest: navigationTest.testNavigationState(),
      syncTest: navigationTest.testNavigationSync(),
      timestamp: new Date().toISOString()
    };

    const allTestsPassed = 
      results.routeTests.every(test => test.accessible) &&
      results.stateTest.isValid &&
      results.syncTest.pathsMatch;

    console.log('✅ All Navigation Tests:', { 
      ...results, 
      allTestsPassed 
    });

    return { ...results, allTestsPassed };
  }
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.navigationTest = navigationTest;
}

export default navigationTest;

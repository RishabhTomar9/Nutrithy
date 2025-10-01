import { lazy } from 'react';

// Lazy load all page components for better performance
const Dashboard = lazy(() => import('../pages/Dashboard'));
const RecipeGuide = lazy(() => import('../components/recipe/RecipeGuide'));
const CommunityFeed = lazy(() => import('../pages/CommunityFeed'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const UserProfile = lazy(() => import('../pages/UserProfile'));
const RegisterProfile = lazy(() => import('../pages/RegisterProfile'));
const DietPlanner = lazy(() => import('../components/diet/DietPlanner'));
const SharedDietPlan = lazy(() => import('../pages/SharedDietPlan'));
const ActivityPage = lazy(() => import('../pages/ActivityPage'));

// Route configuration with metadata
export const routeConfig = [
  {
    path: '/',
    element: Dashboard,
    title: 'Nutrithy - Smart Nutrition & Recipes',
    description: 'Discover healthy recipes and personalized nutrition plans',
    requiresAuth: true,
    requiresProfile: true,
    preloadOnHover: true,
  },
  {
    path: '/login',
    element: LoginPage,
    title: 'Nutrithy - Sign In',
    description: 'Access your personalized nutrition journey',
    requiresAuth: false,
    requiresProfile: false,
    redirectIfAuthenticated: '/',
  },
  {
    path: '/recipes',
    element: RecipeGuide,
    title: 'Nutrithy - Healthy Recipes',
    description: 'Browse nutritious recipes tailored to your goals',
    requiresAuth: true,
    requiresProfile: true,
    preloadOnHover: true,
  },
  {
    path: '/community',
    element: CommunityFeed,
    title: 'Nutrithy - Nutrition Community',
    description: 'Connect with health-conscious food enthusiasts',
    requiresAuth: true,
    requiresProfile: true,
    preloadOnHover: true,
  },
  {
    path: '/activity',
    element: ActivityPage,
    title: 'Nutrithy - Your Activity',
    description: 'Track your nutrition journey, achievements, and community engagement',
    requiresAuth: true,
    requiresProfile: true,
    preloadOnHover: true,
  },
  {
    path: '/profile',
    element: UserProfile,
    title: 'Nutrithy - Your Profile',
    description: 'Manage your nutrition profile and preferences',
    requiresAuth: true,
    requiresProfile: true,
  },
  {
    path: '/register-profile',
    element: RegisterProfile,
    title: 'Nutrithy - Complete Setup',
    description: 'Complete your nutrition profile setup',
    requiresAuth: true,
    requiresProfile: false,
  },
  {
    path: '/diet-planner',
    element: DietPlanner,
    title: 'Nutrithy - Nutrition Planner',
    description: 'Plan your personalized nutrition and meals',
    requiresAuth: true,
    requiresProfile: true,
    preloadOnHover: true,
  },
  {
    path: '/shared-diet-plan/:id',
    element: SharedDietPlan,
    title: 'Nutrithy - Shared Nutrition Plan',
    description: 'View shared nutrition and meal plan',
    requiresAuth: false,
    requiresProfile: false,
  },
  {
    path: '/shared-diet-plan',
    element: SharedDietPlan,
    title: 'Nutrithy - Shared Nutrition Plan',
    description: 'View shared nutrition and meal plan',
    requiresAuth: false,
    requiresProfile: false,
  },
  {
    path: '/user/:userId',
    element: UserProfile,
    title: 'Nutrithy - User Profile',
    description: 'View user nutrition profile and journey',
    requiresAuth: true,
    requiresProfile: true,
  },
];

// Helper function to get route by path
export const getRouteConfig = (path) => {
  return routeConfig.find(route => {
    if (route.path.includes(':')) {
      // Handle dynamic routes
      const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(path);
    }
    return route.path === path;
  });
};

// Helper function to preload route component
export const preloadRoute = (path) => {
  const route = getRouteConfig(path);
  if (route && route.preloadOnHover) {
    // The lazy component will be loaded when this is called
    route.element();
  }
};

// Meta tags for SEO
export const updatePageMeta = (route) => {
  if (!route) return;
  
  document.title = route.title;
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', route.description);
  } else {
    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content = route.description;
    document.head.appendChild(meta);
  }
};

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSidebar } from '../../hooks/useSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  ChefHat, 
  Users, 
  Activity, 
  Calendar, 
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';
import AnimatedLogo from '../logo/AnimatedLogo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const {
    isCollapsed,
    isMobileOpen,
    isMobile,
    isHovering,
    sidebarWidth,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
    handleMouseEnter,
    handleMouseLeave
  } = useSidebar();
  const [activeLink, setActiveLink] = useState('/');
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  // Update active link when route changes
  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  // Handle scroll effect for mobile nav
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items matching the original sidebar
  const navigationItems = useMemo(() => [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Recipes', icon: ChefHat, path: '/recipes' },
    { name: 'Community', icon: Users, path: '/community' },
    { name: 'Activity', icon: Activity, path: '/activity' },
    { name: 'Diet Planner', icon: Calendar, path: '/diet-planner' },
  ], []);

  const handleNavigation = useCallback((path) => {
    setActiveLink(path);
    navigate(path);
    closeMobile();
  }, [navigate, closeMobile]);

  // Handle click outside to close mobile sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeMobile();
      }
    };

    if (isMobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobileOpen, closeMobile]);

  const handleLogout = useCallback(() => {
    logout();
    closeMobile();
  }, [logout, closeMobile]);

  const sidebarVariants = useMemo(() => ({
    expanded: { width: 280 },
    collapsed: { width: 80 },
    hovering: { width: 280 }
  }), []);

  const mobileSidebarVariants = useMemo(() => ({
    open: { x: 0, opacity: 1 },
    closed: { x: -280, opacity: 0 }
  }), []);

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Fixed Logo Header - Always Visible at Top */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/90 dark:bg-gray-900/95 border-b border-white/20 dark:border-gray-700/30 shadow-lg hidden sm:flex items-center justify-center"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(25px) saturate(180%)',
        }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-center py-3 px-4">
          {/* Enhanced Fixed Logo */}
         <motion.div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleNavigation('/')}
          >
            {/* <motion.div 
              className="relative rounded-2xl transition-all duration-300 h-13 w-14"
            >
              <img 
                src="/vite.svg" 
                alt="Logo" 
                className="w-15 h-14 rounded-full object-cover" 
              />
            </motion.div> */}
            <div>
              <AnimatedLogo />
            </div>
          </motion.div>
        </div>
        {/* Animated gradient border at bottom */}
        {/* <div className="absolute bottom-0 left-0 w-full h-1 item-center bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-60" /> */}
      </motion.div>

      {/* Desktop Sidebar - Enhanced with Glass Morphism (Adjusted for fixed logo) */}
      <motion.aside
        ref={sidebarRef}
        initial="expanded"
        animate={isCollapsed && !isHovering ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="hidden lg:flex fixed left-0 h-screen z-40 flex-col backdrop-blur-2xl bg-white/90 dark:bg-gray-900/95 border-b border-white/20 dark:border-gray-700/30 shadow-lg"
        style={{
          top: '70px', // Adjusted to accommodate fixed logo
          height: 'calc(100vh - 80px)',
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(25px) saturate(180%)',
        }}
      >
        {/* Sidebar Header - Simplified since logo is at top */}
        <div className="p-4 border-b border-white/10 dark:border-gray-700/30 relative">
          {/* Animated gradient line */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-60" />
          
          {(!isCollapsed || isHovering) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center"
            >
              <motion.span 
                className="text-sm text-gray-600/80 dark:text-gray-400/80 font-medium px-3 py-1"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
             <AnimatedLogo />
              </motion.span>
            </motion.div>
          )}
          
          {/* Collapsed state indicator */}
          {(isCollapsed && !isHovering) && (
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="w-8 h-1 bg-gradient-to-r from-emerald-500/50 to-blue-500/50 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-3">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeLink === item.path;
            
            return (
              <motion.div key={item.name} className="relative group">
                <motion.button
                  onClick={() => handleNavigation(item.path)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 group overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/50 backdrop-blur-sm'
                  }`}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div 
                      className="absolute left-0 top-0 h-full w-1 bg-white/80 rounded-r-full"
                      initial={{ height: 0 }}
                      animate={{ height: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                                    
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: isActive ? 0 : 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="relative z-10"
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                      isActive ? 'text-white drop-shadow-sm' : 'group-hover:text-emerald-500'
                    }`} />
                  </motion.div>
                  
                  {(!isCollapsed || isHovering) && (
                    <motion.span 
                      className={`font-semibold text-sm truncate relative z-10 transition-all duration-300 ${
                        isActive ? 'text-white drop-shadow-sm' : 'group-hover:text-gray-900 dark:group-hover:text-white'
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </nav>

        {/* Desktop User Profile */}
        {user && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            {(!isCollapsed || isHovering) ? (
              <div className="space-y-3">
                {/* User Info */}
                <div 
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => handleNavigation('/profile')}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.displayName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.displayName?.split(' ')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      My Profile
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {user.displayName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </button>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </motion.aside>

      {/* Mobile Navigation Bar - Positioned below fixed logo */}
      <motion.header 
        className={`lg:hidden fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled 
            ? 'backdrop-blur-2xl bg-white/85 dark:bg-gray-900/90 shadow-xl shadow-gray-900/5 border-b border-white/20 dark:border-gray-700/30' 
            : 'backdrop-blur-xl bg-white/70 dark:bg-gray-900/80 border-b border-white/10 dark:border-gray-800/20'
        }`}
        style={{
          top: '0px', // Positioned below fixed logo
          backgroundImage: scrolled 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(25px) saturate(180%)',
        }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        
        <div className="flex items-center justify-between px-4 py-3 relative">
          {/* Enhanced Menu Button */}
          <motion.button
            onClick={toggleMobile}
            className="group relative p-2.5"
            aria-label="Toggle menu"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" /> */}
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 relative z-10" />
          </motion.button>

          {/* Navigation Title */}
          <AnimatedLogo />

          {/* Enhanced User Profile Button */}
          <motion.button
            onClick={() => handleNavigation('/profile')}
            className="group relative p-2.5 rounded-xl bg-white/20 dark:bg-gray-700/20 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 hover:bg-white/40 dark:hover:bg-gray-600/30 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10">
              {user?.photoURL ? (
                <div className="relative">
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-7 h-7 rounded-full object-cover border-2 border-white/40 group-hover:border-emerald-400/60 transition-all duration-300"
                  />
                  {/* Online indicator */}
                  <motion.div 
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border border-white dark:border-gray-900 shadow-sm"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              ) : (
                <div className="relative">
                  <motion.div 
                    className="w-7 h-7 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:from-emerald-600 group-hover:to-blue-500 transition-all duration-300"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <span className="text-white text-xs font-bold drop-shadow-sm">
                      {user?.displayName?.charAt(0) || 'U'}
                    </span>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
              onClick={closeMobile}
            />

            {/* Mobile Sidebar - Enhanced (Adjusted for fixed logo) */}
            <motion.aside
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileSidebarVariants}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 w-80 backdrop-blur-2xl bg-white/85 dark:bg-gray-900/90 border-r border-white/20 dark:border-gray-700/30 shadow-2xl shadow-black/10 z-40 lg:hidden flex flex-col overflow-hidden"
              style={{
                top: '80px', // Adjusted to start below fixed logo
                height: 'calc(100vh - 80px)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(25px) saturate(180%)',
              }}
            >
              {/* Mobile Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-800/50">
                <motion.span 
                  className="text-sm text-gray-600/80 dark:text-gray-400/80 font-medium px-3 py-1.5 rounded-full bg-white/30 dark:bg-gray-700/30"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  Navigation Menu
                </motion.span>
                
                <motion.button
                  onClick={closeMobile}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeLink === item.path;
                  
                  return (
                    <motion.div key={item.name} className="relative group">
                      <motion.button
                        onClick={() => handleNavigation(item.path)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{item.name}</span>
                      </motion.button>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Mobile User Profile */}
              {user && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="space-y-3">
                    {/* User Info */}
                    <div 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => handleNavigation('/profile')}
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.displayName?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.displayName?.split(' ')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          My Profile
                        </p>
                      </div>
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 p-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

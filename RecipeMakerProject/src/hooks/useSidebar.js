import { useState, useEffect, useCallback } from 'react';

export const useSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Get initial state from localStorage or default to false
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      
      // Auto-close mobile sidebar on resize to desktop
      if (!mobile && isMobileOpen) {
        setIsMobileOpen(false);
      }
      
      // Auto-collapse on smaller screens
      if (window.innerWidth < 1280) { // xl breakpoint
        setIsCollapsed(true);
      }
    };

    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen]);

  // Persist collapsed state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    }
  }, [isCollapsed]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isCollapsed && !isMobile) {
      setIsHovering(true);
    }
  }, [isCollapsed, isMobile]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  // Calculate sidebar width based on state and hover
  const sidebarWidth = isCollapsed && !isHovering ? 80 : 280;
  const mainMargin = isMobile ? 0 : (isCollapsed && !isHovering ? 80 : 280);

  return {
    isCollapsed,
    isMobileOpen,
    isMobile,
    isHovering,
    sidebarWidth,
    mainMargin,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
    handleMouseEnter,
    handleMouseLeave,
    setIsCollapsed,
    setIsMobileOpen
  };
};

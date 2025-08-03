// Theme initialization script - Should be placed in <head> to prevent FOUC
(function() {
  'use strict';
  
  function getStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (e) {
      return null;
    }
  }
  
  function getPreferredTheme() {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  function setTheme(theme) {
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const themeColor = theme === 'dark' ? '#212529' : '#ffffff';
      metaThemeColor.setAttribute('content', themeColor);
    }
  }
  
  // Set initial theme
  const theme = getPreferredTheme();
  setTheme(theme);
  
  // Listen for storage changes (multi-tab sync)
  window.addEventListener('storage', function(e) {
    if (e.key === 'theme') {
      setTheme(e.newValue || 'system');
    }
  });
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    const storedTheme = getStoredTheme();
    if (!storedTheme || storedTheme === 'system') {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
})();

/**
 * Theme Manager
 * Handles application theming, including light/dark mode and custom themes
 */

class ThemeManager {
  constructor() {
    this.themes = {
      light: {
        name: 'light',
        label: 'Light',
        icon: 'sun',
        colors: {
          '--color-primary': '#2563eb',
          '--color-primary-hover': '#1d4ed8',
          '--color-primary-light': '#dbeafe',
          '--color-secondary': '#7c3aed',
          '--color-success': '#10b981',
          '--color-warning': '#f59e0b',
          '--color-danger': '#ef4444',
          '--color-text': '#1f2937',
          '--color-text-secondary': '#4b5563',
          '--color-bg': '#ffffff',
          '--color-bg-secondary': '#f3f4f6',
          '--color-border': '#e5e7eb',
          '--color-card': '#ffffff',
          '--color-card-hover': '#f9fafb',
          '--color-shadow': 'rgba(0, 0, 0, 0.1)'
        }
      },
      dark: {
        name: 'dark',
        label: 'Dark',
        icon: 'moon',
        colors: {
          '--color-primary': '#3b82f6',
          '--color-primary-hover': '#60a5fa',
          '--color-primary-light': '#1e3a8a',
          '--color-secondary': '#8b5cf6',
          '--color-success': '#10b981',
          '--color-warning': '#f59e0b',
          '--color-danger': '#ef4444',
          '--color-text': '#f9fafb',
          '--color-text-secondary': '#d1d5db',
          '--color-bg': '#111827',
          '--color-bg-secondary': '#1f2937',
          '--color-border': '#374151',
          '--color-card': '#1f2937',
          '--color-card-hover': '#1a1f2e',
          '--color-shadow': 'rgba(0, 0, 0, 0.3)'
        }
      }
    };
    
    this.currentTheme = 'light';
    this.systemPreferenceDark = false;
    this.initialized = false;
    this.storageKey = 'app-theme';
    this.themeChangeListeners = [];
    
    // Bind methods
    this.toggleTheme = this.toggleTheme.bind(this);
    this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
  }
  
  /**
   * Initialize the theme manager
   */
  initialize() {
    if (this.initialized) return;
    
    // Check system preference
    this.systemPreferenceDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener(
      'change', 
      this.handleSystemThemeChange
    );
    
    // Load saved theme or use system preference
    const savedTheme = localStorage.getItem(this.storageKey);
    
    if (savedTheme && this.themes[savedTheme]) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme(this.systemPreferenceDark ? 'dark' : 'light');
    }
    
    this.initialized = true;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[ThemeManager] Initialized with theme:', this.currentTheme);
    }
  }
  
  /**
   * Handle system theme change
   * @param {MediaQueryListEvent} event 
   */
  handleSystemThemeChange(event) {
    this.systemPreferenceDark = event.matches;
    
    // Only update if we're following system preference
    const savedTheme = localStorage.getItem(this.storageKey);
    if (!savedTheme) {
      this.setTheme(this.systemPreferenceDark ? 'dark' : 'light');
    }
  }
  
  /**
   * Set the current theme
   * @param {string} themeName - Name of the theme to set
   */
  setTheme(themeName) {
    if (!this.themes[themeName]) {
      console.warn(`[ThemeManager] Theme not found: ${themeName}`);
      return;
    }
    
    this.currentTheme = themeName;
    
    // Update the DOM
    this.applyTheme(themeName);
    
    // Save to localStorage if not following system preference
    localStorage.setItem(this.storageKey, themeName);
    
    // Notify listeners
    this.notifyThemeChange(themeName);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ThemeManager] Theme set to: ${themeName}`);
    }
  }
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
  
  /**
   * Apply theme colors to the document
   * @param {string} themeName - Name of the theme to apply
   */
  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;
    
    const root = document.documentElement;
    
    // Apply each color variable
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Update meta theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.colors['--color-bg']);
    }
    
    // Add/remove dark class to document
    if (themeName === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  
  /**
   * Add a theme change listener
   * @param {Function} callback - Function to call when theme changes
   * @returns {Function} Function to remove the listener
   */
  onThemeChange(callback) {
    if (typeof callback !== 'function') return () => {};
    
    this.themeChangeListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.themeChangeListeners = this.themeChangeListeners.filter(
        listener => listener !== callback
      );
    };
  }
  
  /**
   * Notify all theme change listeners
   * @param {string} themeName - Name of the new theme
   */
  notifyThemeChange(themeName) {
    this.themeChangeListeners.forEach(callback => {
      try {
        callback(themeName, this.themes[themeName]);
      } catch (error) {
        console.error('[ThemeManager] Error in theme change listener:', error);
      }
    });
  }
  
  /**
   * Get the current theme object
   * @returns {Object} Current theme object
   */
  getCurrentTheme() {
    return {
      ...this.themes[this.currentTheme],
      isDark: this.currentTheme === 'dark',
      isSystem: !localStorage.getItem(this.storageKey)
    };
  }
  
  /**
   * Get all available themes
   * @returns {Object} All available themes
   */
  getThemes() {
    return { ...this.themes };
  }
  
  /**
   * Add a custom theme
   * @param {Object} theme - Theme object to add
   */
  addTheme(theme) {
    if (!theme || !theme.name || !theme.colors) {
      console.warn('[ThemeManager] Invalid theme object');
      return;
    }
    
    this.themes[theme.name] = {
      ...theme,
      colors: {
        ...this.themes.light.colors, // Use light theme as base
        ...theme.colors // Override with custom colors
      }
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ThemeManager] Added theme: ${theme.name}`);
    }
  }
  
  /**
   * Remove a custom theme
   * @param {string} themeName - Name of the theme to remove
   */
  removeTheme(themeName) {
    // Prevent removing default themes
    if (themeName === 'light' || themeName === 'dark') {
      console.warn(`[ThemeManager] Cannot remove default theme: ${themeName}`);
      return;
    }
    
    if (this.themes[themeName]) {
      delete this.themes[themeName];
      
      // If current theme was removed, fall back to light theme
      if (this.currentTheme === themeName) {
        this.setTheme('light');
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ThemeManager] Removed theme: ${themeName}`);
      }
    }
  }
  
  /**
   * Reset to system theme preference
   */
  useSystemTheme() {
    localStorage.removeItem(this.storageKey);
    this.setTheme(this.systemPreferenceDark ? 'dark' : 'light');
  }
}

// Create and export singleton instance
const themeManager = new ThemeManager();

// Auto-initialize when the DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => themeManager.initialize());
} else {
  themeManager.initialize();
}

export default themeManager;

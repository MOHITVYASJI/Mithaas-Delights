import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Palette } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Pre-defined themes
const PREDEFINED_THEMES = {
  default: {
    name: 'Default Orange',
    theme_name: 'default',
    primary_color: '#f97316',
    secondary_color: '#f59e0b',
    accent_color: '#ea580c',
    background_color: '#fff7ed',
    text_primary: '#1f2937',
    text_secondary: '#6b7280'
  },
  light: {
    name: 'Light Mode',
    theme_name: 'light',
    primary_color: '#f97316',
    secondary_color: '#f59e0b',
    accent_color: '#ea580c',
    background_color: '#ffffff',
    text_primary: '#1f2937',
    text_secondary: '#6b7280'
  },
  dark: {
    name: 'Dark Mode',
    theme_name: 'dark',
    primary_color: '#f97316',
    secondary_color: '#f59e0b',
    accent_color: '#ea580c',
    background_color: '#111827',
    text_primary: '#f9fafb',
    text_secondary: '#d1d5db'
  }
};

export const ThemeSwitcher = () => {
  const [activeTheme, setActiveTheme] = useState('default');
  const [customThemes, setCustomThemes] = useState([]);
  const [userMode, setUserMode] = useState('light'); // light or dark
  const [globalTheme, setGlobalTheme] = useState(null);

  useEffect(() => {
    loadActiveTheme();
    fetchCustomThemes();
    loadUserThemePreference();
  }, []);

  const loadActiveTheme = async () => {
    try {
      const response = await axios.get(`${API}/themes/active`);
      const theme = response.data;
      setGlobalTheme(theme);
      
      // Apply admin's global theme with user's mode preference
      applyThemeWithMode(theme, userMode);
      setActiveTheme(theme.name || 'default');
    } catch (error) {
      console.error('Error loading theme:', error);
      // Apply default theme
      applyThemeWithMode(PREDEFINED_THEMES.default, userMode);
    }
  };

  const loadUserThemePreference = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Not logged in, use localStorage
        const savedMode = localStorage.getItem('user-theme-mode') || 'light';
        setUserMode(savedMode);
        return;
      }

      const response = await axios.get(`${API}/user/theme-preference`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mode = response.data.theme_mode || 'light';
      setUserMode(mode);
      localStorage.setItem('user-theme-mode', mode);
    } catch (error) {
      console.error('Error loading user theme preference:', error);
      const savedMode = localStorage.getItem('user-theme-mode') || 'light';
      setUserMode(savedMode);
    }
  };

  const fetchCustomThemes = async () => {
    try {
      const response = await axios.get(`${API}/themes`);
      setCustomThemes(response.data || []);
    } catch (error) {
      console.error('Error fetching custom themes:', error);
    }
  };

  const applyThemeWithMode = (theme, mode) => {
    const root = document.documentElement;
    const body = document.body;
    
    let themeColors;
    if (typeof theme === 'string') {
      themeColors = PREDEFINED_THEMES[theme];
    } else if (theme && theme.colors) {
      themeColors = theme.colors;
    } else {
      themeColors = PREDEFINED_THEMES.default;
    }
    
    // Get colors based on mode
    let bgColor, textPrimary, textSecondary;
    if (mode === 'dark') {
      bgColor = '#111827';
      textPrimary = '#f9fafb';
      textSecondary = '#d1d5db';
      root.classList.add('dark');
    } else {
      bgColor = themeColors.background || '#ffffff';
      textPrimary = themeColors.text_primary || '#1f2937';
      textSecondary = themeColors.text_secondary || '#6b7280';
      root.classList.remove('dark');
    }
    
    // Apply theme colors
    root.style.setProperty('--primary-color', themeColors.primary || themeColors.primary_color || '#f97316');
    root.style.setProperty('--secondary-color', themeColors.secondary || themeColors.secondary_color || '#f59e0b');
    root.style.setProperty('--accent-color', themeColors.accent || themeColors.accent_color || '#ea580c');
    root.style.setProperty('--background-color', bgColor);
    root.style.setProperty('--text-primary', textPrimary);
    root.style.setProperty('--text-secondary', textSecondary);
    
    // Apply to body
    body.style.backgroundColor = bgColor;
    body.style.color = textPrimary;

    // Save to localStorage
    localStorage.setItem('active-theme', typeof theme === 'string' ? theme : (theme.name || 'default'));
    localStorage.setItem('user-theme-mode', mode);
    
    // Force re-render by dispatching a custom event
    window.dispatchEvent(new Event('themeChanged'));
  };

  const toggleUserMode = async () => {
    const newMode = userMode === 'light' ? 'dark' : 'light';
    setUserMode(newMode);
    
    // Apply immediately
    applyThemeWithMode(globalTheme || PREDEFINED_THEMES.default, newMode);
    
    // Save to backend if logged in
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.put(
          `${API}/user/theme-preference`,
          { theme_mode: newMode },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      toast.success(`Switched to ${newMode} mode`);
    } catch (error) {
      console.error('Error saving theme preference:', error);
      // Still works locally even if backend fails
    }
  };

  const switchTheme = async (themeName) => {
    try {
      const predefTheme = PREDEFINED_THEMES[themeName];
      if (predefTheme) {
        applyTheme(themeName);
        setActiveTheme(themeName);
        toast.success(`Switched to ${predefTheme.name} theme`);
        
        // Optionally save to backend for persistence
        // This would require creating a theme record or updating user preferences
      }
    } catch (error) {
      console.error('Error switching theme:', error);
      toast.error('Failed to switch theme');
    }
  };

  const switchToCustomTheme = async (themeId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login as admin to change global themes');
        return;
      }
      
      await axios.put(
        `${API}/themes/${themeId}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Reload active theme with current user mode
      await loadActiveTheme();
      toast.success('Global theme activated successfully');
    } catch (error) {
      console.error('Error activating theme:', error);
      toast.error('Failed to activate theme. Admin access may be required.');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" data-testid="theme-switcher-button">
          <Palette className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* User Mode Toggle (Light/Dark) */}
        <div className="px-2 py-2 border-b">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-700">Display Mode</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            onClick={toggleUserMode}
            data-testid="toggle-dark-mode"
          >
            <span>{userMode === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
            <span className="text-xs text-gray-500">Click to toggle</span>
          </Button>
        </div>

        <div className="px-2 py-1.5 text-sm font-semibold text-gray-700">Active Theme: {activeTheme}</div>

        {/* Custom Themes from Admin */}
        {customThemes.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs text-gray-500">
              Admin Global Themes
            </div>
            {customThemes.map((theme) => (
              <DropdownMenuItem
                key={theme.id}
                onClick={() => switchToCustomTheme(theme.id)}
                className={`cursor-pointer ${activeTheme === theme.name ? 'bg-orange-50' : ''}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: theme.colors?.primary || '#f97316' }}
                  />
                  <span className="flex-1 text-sm">{theme.display_name || theme.name}</span>
                  {theme.is_active && (
                    <span className="text-xs text-orange-600">✓</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;

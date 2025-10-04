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

  useEffect(() => {
    loadActiveTheme();
    fetchCustomThemes();
  }, []);

  const loadActiveTheme = async () => {
    try {
      const response = await axios.get(`${API}/themes/active`);
      const theme = response.data;
      
      // Apply theme colors
      applyTheme(theme);
      setActiveTheme(theme.name || 'default');
    } catch (error) {
      console.error('Error loading theme:', error);
      // Apply default theme
      applyTheme(PREDEFINED_THEMES.default);
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

  const applyTheme = (theme) => {
    const root = document.documentElement;
    
    if (typeof theme === 'string') {
      // Pre-defined theme
      const predef = PREDEFINED_THEMES[theme];
      if (predef) {
        root.style.setProperty('--primary-color', predef.primary_color);
        root.style.setProperty('--secondary-color', predef.secondary_color);
        root.style.setProperty('--accent-color', predef.accent_color);
        root.style.setProperty('--background-color', predef.background_color);
        root.style.setProperty('--text-primary', predef.text_primary);
        root.style.setProperty('--text-secondary', predef.text_secondary);
      }
    } else {
      // Custom theme from backend
      root.style.setProperty('--primary-color', theme.primary_color || PREDEFINED_THEMES.default.primary_color);
      root.style.setProperty('--secondary-color', theme.secondary_color || PREDEFINED_THEMES.default.secondary_color);
      root.style.setProperty('--accent-color', theme.accent_color || PREDEFINED_THEMES.default.accent_color);
      root.style.setProperty('--background-color', theme.background_color || PREDEFINED_THEMES.default.background_color);
      root.style.setProperty('--text-primary', theme.text_primary || PREDEFINED_THEMES.default.text_primary);
      root.style.setProperty('--text-secondary', theme.text_secondary || PREDEFINED_THEMES.default.text_secondary);
    }

    // Save to localStorage
    localStorage.setItem('active-theme', typeof theme === 'string' ? theme : theme.theme_name);
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
        toast.error('Please login to change themes');
        return;
      }
      
      await axios.put(
        `${API}/themes/${themeId}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      loadActiveTheme();
      toast.success('Theme activated successfully');
    } catch (error) {
      console.error('Error activating theme:', error);
      toast.error('Failed to activate theme');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" data-testid="theme-switcher-button">
          <Palette className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold text-gray-700">Choose Theme</div>
        
        {/* Pre-defined Themes */}
        {Object.entries(PREDEFINED_THEMES).map(([key, theme]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => switchTheme(key)}
            className={`cursor-pointer ${activeTheme === key ? 'bg-orange-50' : ''}`}
            data-testid={`theme-${key}`}
          >
            <div className="flex items-center gap-3 w-full">
              <div
                className="w-6 h-6 rounded-full border-2 border-gray-200"
                style={{ backgroundColor: theme.primary_color }}
              />
              <span className="flex-1">{theme.name}</span>
              {activeTheme === key && (
                <span className="text-xs text-orange-600">✓</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}

        {/* Custom Themes from Admin */}
        {customThemes.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-sm font-semibold text-gray-700 border-t mt-2 pt-2">
              Custom Themes
            </div>
            {customThemes.map((theme) => (
              <DropdownMenuItem
                key={theme.id}
                onClick={() => switchToCustomTheme(theme.id)}
                className={`cursor-pointer ${activeTheme === theme.theme_name ? 'bg-orange-50' : ''}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: theme.primary_color }}
                  />
                  <span className="flex-1">{theme.theme_name}</span>
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

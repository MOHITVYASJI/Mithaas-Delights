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
    primary: '#f97316',
    secondary: '#f59e0b',
    accent: '#ea580c',
    background: '#fff7ed'
  },
  festival: {
    name: 'Festival (Diwali)',
    primary: '#dc2626',
    secondary: '#fbbf24',
    accent: '#b91c1c',
    background: '#fef3c7'
  },
  modern: {
    name: 'Modern Blue',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#2563eb',
    background: '#eff6ff'
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
      const response = await axios.get(`${API}/settings/theme`);
      const theme = response.data;
      
      // Apply theme colors
      applyTheme(theme);
      setActiveTheme(theme.theme_name || 'default');
    } catch (error) {
      console.error('Error loading theme:', error);
      // Apply default theme
      applyTheme(PREDEFINED_THEMES.default);
    }
  };

  const fetchCustomThemes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API}/settings/themes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomThemes(response.data);
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
        root.style.setProperty('--primary-color', predef.primary);
        root.style.setProperty('--secondary-color', predef.secondary);
        root.style.setProperty('--accent-color', predef.accent);
        root.style.setProperty('--background-color', predef.background);
      }
    } else {
      // Custom theme from backend
      root.style.setProperty('--primary-color', theme.primary_color || PREDEFINED_THEMES.default.primary);
      root.style.setProperty('--secondary-color', theme.secondary_color || PREDEFINED_THEMES.default.secondary);
      root.style.setProperty('--accent-color', theme.accent_color || PREDEFINED_THEMES.default.accent);
      root.style.setProperty('--background-color', theme.background_color || PREDEFINED_THEMES.default.background);
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
      const response = await axios.put(
        `${API}/settings/theme/${themeId}/activate`,
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
                style={{ backgroundColor: theme.primary }}
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

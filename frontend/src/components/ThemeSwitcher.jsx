// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Palette, Sun, Moon } from 'lucide-react';
// import { Button } from './ui/button';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
//   DropdownMenuSeparator,
// } from './ui/dropdown-menu';
// import { toast } from 'sonner';

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// const API = `${BACKEND_URL}/api`;

// export const ThemeSwitcher = () => {
//   const [activeTheme, setActiveTheme] = useState('default');
//   const [customThemes, setCustomThemes] = useState([]);
//   const [userMode, setUserMode] = useState('light'); // light or dark
//   const [globalTheme, setGlobalTheme] = useState(null);

//   useEffect(() => {
//     loadActiveTheme();
//     fetchCustomThemes();
//     loadUserThemePreference();
//   }, []);

//   const loadActiveTheme = async () => {
//     try {
//       const response = await axios.get(`${API}/themes/active`);
//       const theme = response.data;
//       setGlobalTheme(theme);
      
//       // Apply admin's global theme with user's mode preference
//       const savedMode = localStorage.getItem('user-theme-mode') || 'light';
//       applyThemeWithMode(theme, savedMode);
//       setActiveTheme(theme.name || theme.display_name || 'default');
//     } catch (error) {
//       console.error('Error loading theme:', error);
//       // Apply default theme
//       const savedMode = localStorage.getItem('user-theme-mode') || 'light';
//       applyDefaultTheme(savedMode);
//     }
//   };

//   const loadUserThemePreference = async () => {
//     const savedMode = localStorage.getItem('user-theme-mode') || 'light';
//     setUserMode(savedMode);
    
//     try {
//       const token = localStorage.getItem('token');
      
//       if (!token) {
//         return;
//       }

//       const response = await axios.get(`${API}/user/theme-preference`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       if (response.data && response.data.theme_mode) {
//         const mode = response.data.theme_mode;
//         setUserMode(mode);
//         localStorage.setItem('user-theme-mode', mode);
//       }
//     } catch (error) {
//       // Silent fail - use localStorage value
//       console.log('Using local theme preference');
//     }
//   };

//   const fetchCustomThemes = async () => {
//     try {
//       const response = await axios.get(`${API}/themes`);
//       setCustomThemes(response.data || []);
//     } catch (error) {
//       console.error('Error fetching custom themes:', error);
//     }
//   };

//   const applyDefaultTheme = (mode) => {
//     const defaultColors = {
//       primary: '#f97316',
//       secondary: '#f59e0b',
//       accent: '#ea580c',
//       background: '#ffffff',
//       surface: '#fff7ed',
//       text_primary: '#1f2937',
//       text_secondary: '#6b7280'
//     };
    
//     applyThemeColors(defaultColors, mode);
//   };

//   const applyThemeWithMode = (theme, mode) => {
//     let themeColors;
    
//     if (theme && theme.colors) {
//       themeColors = theme.colors;
//     } else {
//       themeColors = {
//         primary: '#f97316',
//         secondary: '#f59e0b',
//         accent: '#ea580c',
//         background: '#ffffff',
//         surface: '#fff7ed',
//         text_primary: '#1f2937',
//         text_secondary: '#6b7280'
//       };
//     }
    
//     applyThemeColors(themeColors, mode);
//   };

//   // Helper function to calculate contrast and adjust colors automatically
//   const getContrastColor = (backgroundColor) => {
//     // Convert hex to RGB
//     const hex = backgroundColor.replace('#', '');
//     const r = parseInt(hex.substr(0, 2), 16);
//     const g = parseInt(hex.substr(2, 2), 16);
//     const b = parseInt(hex.substr(4, 2), 16);
    
//     // Calculate luminance
//     const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
//     // Return high contrast color
//     return luminance > 0.5 ? '#1f2937' : '#f9fafb';
//   };
//   const applyThemeColors = (colors, mode) => {
//     const root = document.documentElement;
//     const body = document.body;
    
//     // Apply dark/light mode class
//     if (mode === 'dark') {
//       root.classList.add('dark');
//       root.setAttribute('data-theme', 'dark');
//       body.classList.add('dark');
      
//       // Dark mode colors with auto-contrast
//       const darkBg = '#111827';
//       const darkSurface = '#1f2937';
      
//       root.style.setProperty('--background-color', darkBg);
//       root.style.setProperty('--surface-color', darkSurface);
//       root.style.setProperty('--card-bg', darkSurface);
//       root.style.setProperty('--text-primary', '#f9fafb');
//       root.style.setProperty('--text-secondary', '#d1d5db');
//       root.style.setProperty('--text-muted', '#9ca3af');
//       root.style.setProperty('--border-color', '#374151');
//       root.style.setProperty('--border-light', '#4b5563');
//       root.style.setProperty('--gradient-hero', `linear-gradient(to bottom right, ${darkBg}, ${darkSurface}, ${darkBg})`);
//     } else {
//       root.classList.remove('dark');
//       root.removeAttribute('data-theme');
//       body.classList.remove('dark');
      
//       // Light mode colors with theme colors and auto-contrast
//       const lightBg = colors.background || '#ffffff';
//       const lightSurface = colors.surface || '#fff7ed';
      
//       // Auto-calculate contrasting text colors
//       const autoTextPrimary = colors.text_primary || getContrastColor(lightBg);
//       const autoTextSecondary = colors.text_secondary || getContrastColor(lightSurface);
      
//       root.style.setProperty('--background-color', lightBg);
//       root.style.setProperty('--surface-color', lightSurface);
//       root.style.setProperty('--card-bg', '#ffffff');
//       root.style.setProperty('--text-primary', autoTextPrimary);
//       root.style.setProperty('--text-secondary', autoTextSecondary);
//       root.style.setProperty('--text-muted', '#9ca3af');
//       root.style.setProperty('--border-color', colors.border || '#fed7aa');
//       root.style.setProperty('--border-light', '#fef3c7');
//       root.style.setProperty('--gradient-hero', `linear-gradient(to bottom right, ${lightSurface}, #fef3c7, ${lightSurface})`);
//     }
    
//     // Apply theme primary colors (work in both modes) with contrast text
//     const primaryColor = colors.primary || '#f97316';
//     const secondaryColor = colors.secondary || '#f59e0b';
//     const accentColor = colors.accent || '#ea580c';
    
//     root.style.setProperty('--primary-color', primaryColor);
//     root.style.setProperty('--secondary-color', secondaryColor);
//     root.style.setProperty('--accent-color', accentColor);
//     root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`);
    
//     // Auto-contrast text for buttons and interactive elements
//     root.style.setProperty('--primary-text', getContrastColor(primaryColor));
//     root.style.setProperty('--secondary-text', getContrastColor(secondaryColor));
//     root.style.setProperty('--accent-text', getContrastColor(accentColor));
    
//     // Apply to body
//     body.style.backgroundColor = mode === 'dark' ? '#111827' : (colors.background || '#ffffff');
//     body.style.color = mode === 'dark' ? '#f9fafb' : (colors.text_primary || getContrastColor(colors.background || '#ffffff'));

//     // Save to localStorage
//     localStorage.setItem('user-theme-mode', mode);
    
//     // Force re-render by dispatching a custom event
//     window.dispatchEvent(new Event('themeChanged'));
    
//     // Broadcast theme change to other components
//     window.dispatchEvent(new CustomEvent('globalThemeUpdate', { 
//       detail: { colors, mode, timestamp: Date.now() } 
//     }));
//   };

//   const toggleUserMode = async () => {
//     const newMode = userMode === 'light' ? 'dark' : 'light';
//     setUserMode(newMode);
    
//     // Apply immediately
//     applyThemeWithMode(globalTheme, newMode);
    
//     // Save to backend if logged in
//     try {
//       const token = localStorage.getItem('token');
//       if (token) {
//         await axios.put(
//           `${API}/user/theme-preference`,
//           { theme_mode: newMode },
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//       }
//       toast.success(`Switched to ${newMode} mode`);
//     } catch (error) {
//       console.error('Error saving theme preference:', error);
//       // Still works locally even if backend fails
//       toast.success(`Switched to ${newMode} mode`);
//     }
//   };

//   const switchToCustomTheme = async (themeId) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         toast.error('Please login as admin to change global themes');
//         return;
//       }
      
//       await axios.put(
//         `${API}/themes/${themeId}/activate`,
//         {},
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       // Reload active theme with current user mode
//       await loadActiveTheme();
//       toast.success('Global theme activated successfully');
//     } catch (error) {
//       console.error('Error activating theme:', error);
//       toast.error('Failed to activate theme. Admin access may be required.');
//     }
//   };

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant="ghost" size="sm" data-testid="theme-switcher-button">
//           <Palette className="w-5 h-5" />
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end" className="w-72">
//         {/* User Mode Toggle (Light/Dark) */}
//         <div className="px-3 py-3 border-b">
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-sm font-semibold">Display Mode</span>
//           </div>
//           <Button
//             variant="outline"
//             size="sm"
//             className="w-full justify-between hover:bg-orange-50"
//             onClick={toggleUserMode}
//             data-testid="toggle-dark-mode"
//           >
//             <span className="flex items-center gap-2">
//               {userMode === 'light' ? (
//                 <>
//                   <Sun className="w-4 h-4 text-orange-500" />
//                   <span>Light Mode</span>
//                 </>
//               ) : (
//                 <>
//                   <Moon className="w-4 h-4 text-blue-400" />
//                   <span>Dark Mode</span>
//                 </>
//               )}
//             </span>
//             <span className="text-xs text-gray-500">Click to toggle</span>
//           </Button>
//         </div>

//         <div className="px-3 py-2 text-sm">
//           <span className="font-semibold text-gray-700">Active Theme:</span>
//           <span className="ml-2 text-orange-600">{activeTheme}</span>
//         </div>

//         <DropdownMenuSeparator />

//         {/* Custom Themes from Admin */}
//         {customThemes.length > 0 && (
//           <>
//             <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
//               Admin Global Themes
//             </div>
//             {customThemes.map((theme) => (
//               <DropdownMenuItem
//                 key={theme.id}
//                 onClick={() => switchToCustomTheme(theme.id)}
//                 className={`cursor-pointer mx-2 rounded-md ${
//                   activeTheme === theme.name ? 'bg-orange-50' : ''
//                 }`}
//               >
//                 <div className="flex items-center gap-3 w-full py-1">
//                   <div
//                     className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-sm flex-shrink-0"
//                     style={{ 
//                       background: `linear-gradient(135deg, ${theme.colors?.primary || '#f97316'}, ${theme.colors?.secondary || '#f59e0b'})`
//                     }}
//                   />
//                   <div className="flex-1">
//                     <div className="text-sm font-medium">{theme.display_name || theme.name}</div>
//                     {theme.description && (
//                       <div className="text-xs text-gray-500">{theme.description}</div>
//                     )}
//                   </div>
//                   {theme.is_active && (
//                     <span className="text-orange-600 font-bold">✓</span>
//                   )}
//                 </div>
//               </DropdownMenuItem>
//             ))}
//           </>
//         )}

//         <DropdownMenuSeparator />

//         <div className="px-3 py-2 text-xs text-gray-500">
//           Theme changes apply to the entire website instantly
//         </div>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// };

// export default ThemeSwitcher;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ThemeSwitcher = () => {
  const [userMode, setUserMode] = useState('light'); // light or dark
  const [globalTheme, setGlobalTheme] = useState(null);

  useEffect(() => {
    loadActiveTheme();
    loadUserThemePreference();
  }, []);

  const loadActiveTheme = async () => {
    try {
      const response = await axios.get(`${API}/themes/active`);
      const theme = response.data;
      setGlobalTheme(theme);
      
      // Apply admin's global theme with user's mode preference
      const savedMode = localStorage.getItem('user-theme-mode') || 'light';
      applyThemeWithMode(theme, savedMode);
    } catch (error) {
      console.error('Error loading theme:', error);
      // Apply default theme
      const savedMode = localStorage.getItem('user-theme-mode') || 'light';
      applyDefaultTheme(savedMode);
    }
  };

  const loadUserThemePreference = async () => {
    const savedMode = localStorage.getItem('user-theme-mode') || 'light';
    setUserMode(savedMode);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      const response = await axios.get(`${API}/user/theme-preference`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.theme_mode) {
        const mode = response.data.theme_mode;
        setUserMode(mode);
        localStorage.setItem('user-theme-mode', mode);
      }
    } catch (error) {
      // Silent fail - use localStorage value
      console.log('Using local theme preference');
    }
  };


  const applyDefaultTheme = (mode) => {
    const defaultColors = {
      primary: '#f97316',
      secondary: '#f59e0b',
      accent: '#ea580c',
      background: '#ffffff',
      surface: '#fff7ed',
      text_primary: '#1f2937',
      text_secondary: '#6b7280'
    };
    
    applyThemeColors(defaultColors, mode);
  };

  const applyThemeWithMode = (theme, mode) => {
    let themeColors;
    
    if (theme && theme.colors) {
      themeColors = theme.colors;
    } else {
      themeColors = {
        primary: '#f97316',
        secondary: '#f59e0b',
        accent: '#ea580c',
        background: '#ffffff',
        surface: '#fff7ed',
        text_primary: '#1f2937',
        text_secondary: '#6b7280'
      };
    }
    
    applyThemeColors(themeColors, mode);
  };

  // Helper function to calculate contrast and adjust colors automatically
  const getContrastColor = (backgroundColor) => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return high contrast color
    return luminance > 0.5 ? '#1f2937' : '#f9fafb';
  };
  const applyThemeColors = (colors, mode) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Apply dark/light mode class
    if (mode === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      body.classList.add('dark');
      
      // Dark mode colors with auto-contrast
      const darkBg = '#111827';
      const darkSurface = '#1f2937';
      
      root.style.setProperty('--background-color', darkBg);
      root.style.setProperty('--surface-color', darkSurface);
      root.style.setProperty('--card-bg', darkSurface);
      root.style.setProperty('--text-primary', '#f9fafb');
      root.style.setProperty('--text-secondary', '#d1d5db');
      root.style.setProperty('--text-muted', '#9ca3af');
      root.style.setProperty('--border-color', '#374151');
      root.style.setProperty('--border-light', '#4b5563');
      root.style.setProperty('--gradient-hero', `linear-gradient(to bottom right, ${darkBg}, ${darkSurface}, ${darkBg})`);
    } else {
      root.classList.remove('dark');
      root.removeAttribute('data-theme');
      body.classList.remove('dark');
      
      // Light mode colors with theme colors and auto-contrast
      const lightBg = colors.background || '#ffffff';
      const lightSurface = colors.surface || '#fff7ed';
      
      // Auto-calculate contrasting text colors
      const autoTextPrimary = colors.text_primary || getContrastColor(lightBg);
      const autoTextSecondary = colors.text_secondary || getContrastColor(lightSurface);
      
      root.style.setProperty('--background-color', lightBg);
      root.style.setProperty('--surface-color', lightSurface);
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--text-primary', autoTextPrimary);
      root.style.setProperty('--text-secondary', autoTextSecondary);
      root.style.setProperty('--text-muted', '#9ca3af');
      root.style.setProperty('--border-color', colors.border || '#fed7aa');
      root.style.setProperty('--border-light', '#fef3c7');
      root.style.setProperty('--gradient-hero', `linear-gradient(to bottom right, ${lightSurface}, #fef3c7, ${lightSurface})`);
    }
    
    // Apply theme primary colors (work in both modes) with contrast text
    const primaryColor = colors.primary || '#f97316';
    const secondaryColor = colors.secondary || '#f59e0b';
    const accentColor = colors.accent || '#ea580c';
    
    root.style.setProperty('--primary-color', primaryColor);
    root.style.setProperty('--secondary-color', secondaryColor);
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`);
    
    // Auto-contrast text for buttons and interactive elements
    root.style.setProperty('--primary-text', getContrastColor(primaryColor));
    root.style.setProperty('--secondary-text', getContrastColor(secondaryColor));
    root.style.setProperty('--accent-text', getContrastColor(accentColor));
    
    // Apply to body
    body.style.backgroundColor = mode === 'dark' ? '#111827' : (colors.background || '#ffffff');
    body.style.color = mode === 'dark' ? '#f9fafb' : (colors.text_primary || getContrastColor(colors.background || '#ffffff'));

    // Save to localStorage
    localStorage.setItem('user-theme-mode', mode);
    
    // Force re-render by dispatching a custom event
    window.dispatchEvent(new Event('themeChanged'));
    
    // Broadcast theme change to other components
    window.dispatchEvent(new CustomEvent('globalThemeUpdate', { 
      detail: { colors, mode, timestamp: Date.now() } 
    }));
  };

  const toggleUserMode = async () => {
    const newMode = userMode === 'light' ? 'dark' : 'light';
    setUserMode(newMode);
    
    // Apply immediately
    applyThemeWithMode(globalTheme, newMode);
    
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
      toast.success(`Switched to ${newMode} mode`);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleUserMode}
      data-testid="theme-switcher-button"
      className="flex items-center gap-2"
    >
      {userMode === 'light' ? (
        <>
          <Sun className="w-5 h-5 text-orange-500" />
          <span className="hidden sm:inline text-sm">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-5 h-5 text-blue-400" />
          <span className="hidden sm:inline text-sm">Dark</span>
        </>
      )}
    </Button>
  );
};

export default ThemeSwitcher;
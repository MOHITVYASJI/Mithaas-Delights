import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Palette, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Sun, 
  Moon,
  Eye,
  Save,
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const EnhancedThemeManager = () => {
  const [themes, setThemes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTheme, setEditingTheme] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(null);
  
  const { activeTheme, userMode, toggleMode, activateTheme } = useTheme();

  // Load all themes
  const loadThemes = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API}/themes`);
      setThemes(response.data || []);
    } catch (error) {
      console.error('Error loading themes:', error);
      toast.error('Failed to load themes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadThemes();
  }, []);

  // New theme form
  const [newThemeForm, setNewThemeForm] = useState({
    name: '',
    display_name: '',
    description: '',
    colors: {
      primary: '#f97316',
      secondary: '#f59e0b',
      accent: '#ea580c',
      background: '#ffffff',
      surface: '#fff7ed',
      text_primary: '#1f2937',
      text_secondary: '#6b7280',
      border: '#fed7aa',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    festival_mode: false,
    festival_name: ''
  });

  // Create new theme
  const handleCreateTheme = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Admin authentication required');
        return;
      }

      await axios.post(
        `${API}/themes`,
        newThemeForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Theme created successfully');
      setIsCreatingNew(false);
      setNewThemeForm({
        name: '',
        display_name: '',
        description: '',
        colors: {
          primary: '#f97316',
          secondary: '#f59e0b',
          accent: '#ea580c',
          background: '#ffffff',
          surface: '#fff7ed',
          text_primary: '#1f2937',
          text_secondary: '#6b7280',
          border: '#fed7aa',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6'
        },
        festival_mode: false,
        festival_name: ''
      });
      await loadThemes();
    } catch (error) {
      console.error('Error creating theme:', error);
      toast.error('Failed to create theme');
    }
  };

  // Update theme
  const handleUpdateTheme = async (themeId, themeData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Admin authentication required');
        return;
      }

      await axios.put(
        `${API}/themes/${themeId}`,
        themeData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Theme updated successfully');
      setEditingTheme(null);
      await loadThemes();
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error('Failed to update theme');
    }
  };

  // Delete theme
  const handleDeleteTheme = async (themeId) => {
    if (!window.confirm('Are you sure you want to delete this theme?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Admin authentication required');
        return;
      }

      await axios.delete(
        `${API}/themes/${themeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Theme deleted successfully');
      await loadThemes();
    } catch (error) {
      console.error('Error deleting theme:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete theme');
    }
  };

  // Activate theme
  const handleActivateTheme = async (themeId) => {
    try {
      await activateTheme(themeId);
      toast.success('Theme activated successfully');
      await loadThemes();
      
      // Broadcast theme change to all users (in a real app, this would use WebSockets)
      window.dispatchEvent(new CustomEvent('globalThemeUpdate', { 
        detail: { 
          theme: themes.find(t => t.id === themeId), 
          mode: userMode,
          timestamp: Date.now() 
        } 
      }));
    } catch (error) {
      toast.error('Failed to activate theme');
    }
  };

  // Preview theme
  const handlePreviewTheme = (theme) => {
    setPreviewTheme(theme);
    // Temporarily apply theme for preview
    const root = document.documentElement;
    const colors = theme.colors;
    
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    root.style.setProperty('--accent-color', colors.accent);
    root.style.setProperty('--background-color', colors.background);
    root.style.setProperty('--surface-color', colors.surface);
    
    // Auto-restore after 3 seconds
    setTimeout(() => {
      setPreviewTheme(null);
      if (activeTheme) {
        const activeColors = activeTheme.colors;
        root.style.setProperty('--primary-color', activeColors.primary);
        root.style.setProperty('--secondary-color', activeColors.secondary);
        root.style.setProperty('--accent-color', activeColors.accent);
        root.style.setProperty('--background-color', activeColors.background);
        root.style.setProperty('--surface-color', activeColors.surface);
      }
    }, 3000);
  };

  const ColorInput = ({ label, value, onChange }) => (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium min-w-[80px]">{label}:</label>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 p-1 rounded cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-xs"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading themes...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="enhanced-theme-manager">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Theme Management</h2>
          {previewTheme && (
            <Badge variant="secondary" className="animate-pulse">
              Previewing: {previewTheme.display_name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMode}
            data-testid="toggle-preview-mode"
          >
            {userMode === 'light' ? (
              <>
                <Sun className="w-4 h-4 mr-2" />
                Light
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 mr-2" />
                Dark
              </>
            )}
          </Button>
          <Button 
            onClick={() => setIsCreatingNew(true)}
            data-testid="create-new-theme-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Theme
          </Button>
        </div>
      </div>

      {/* Active theme info */}
      {activeTheme && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{activeTheme.display_name}</h3>
                <p className="text-sm text-muted-foreground">{activeTheme.description}</p>
              </div>
              <Badge className="bg-primary text-primary-foreground">
                Currently Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create new theme form */}
      {isCreatingNew && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New Theme</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreatingNew(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name (ID)</label>
                <Input
                  value={newThemeForm.name}
                  onChange={(e) => setNewThemeForm({...newThemeForm, name: e.target.value})}
                  placeholder="theme_name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  value={newThemeForm.display_name}
                  onChange={(e) => setNewThemeForm({...newThemeForm, display_name: e.target.value})}
                  placeholder="Beautiful Theme"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newThemeForm.description}
                onChange={(e) => setNewThemeForm({...newThemeForm, description: e.target.value})}
                placeholder="Theme description..."
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Colors</h4>
              <div className="grid grid-cols-2 gap-3">
                <ColorInput
                  label="Primary"
                  value={newThemeForm.colors.primary}
                  onChange={(value) => setNewThemeForm({
                    ...newThemeForm,
                    colors: {...newThemeForm.colors, primary: value}
                  })}
                />
                <ColorInput
                  label="Secondary"
                  value={newThemeForm.colors.secondary}
                  onChange={(value) => setNewThemeForm({
                    ...newThemeForm,
                    colors: {...newThemeForm.colors, secondary: value}
                  })}
                />
                <ColorInput
                  label="Accent"
                  value={newThemeForm.colors.accent}
                  onChange={(value) => setNewThemeForm({
                    ...newThemeForm,
                    colors: {...newThemeForm.colors, accent: value}
                  })}
                />
                <ColorInput
                  label="Background"
                  value={newThemeForm.colors.background}
                  onChange={(value) => setNewThemeForm({
                    ...newThemeForm,
                    colors: {...newThemeForm.colors, background: value}
                  })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={newThemeForm.festival_mode}
                onCheckedChange={(checked) => setNewThemeForm({
                  ...newThemeForm,
                  festival_mode: checked
                })}
              />
              <label className="text-sm">Festival Theme</label>
              {newThemeForm.festival_mode && (
                <Input
                  value={newThemeForm.festival_name}
                  onChange={(e) => setNewThemeForm({
                    ...newThemeForm,
                    festival_name: e.target.value
                  })}
                  placeholder="Festival name"
                  className="w-40"
                />
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreatingNew(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTheme} data-testid="save-new-theme">
                <Save className="w-4 h-4 mr-2" />
                Create Theme
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Themes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <Card 
            key={theme.id} 
            className={`relative overflow-hidden transition-all hover:shadow-lg ${
              activeTheme?.id === theme.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{theme.display_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{theme.description}</p>
                </div>
                {theme.is_active && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
                {theme.festival_mode && (
                  <Badge variant="secondary">{theme.festival_name}</Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Color palette preview */}
              <div className="grid grid-cols-5 gap-1 mb-4">
                <div 
                  className="w-full h-6 rounded"
                  style={{ backgroundColor: theme.colors.primary }}
                  title="Primary"
                />
                <div 
                  className="w-full h-6 rounded"
                  style={{ backgroundColor: theme.colors.secondary }}
                  title="Secondary"
                />
                <div 
                  className="w-full h-6 rounded"
                  style={{ backgroundColor: theme.colors.accent }}
                  title="Accent"
                />
                <div 
                  className="w-full h-6 rounded border"
                  style={{ backgroundColor: theme.colors.background }}
                  title="Background"
                />
                <div 
                  className="w-full h-6 rounded border"
                  style={{ backgroundColor: theme.colors.surface }}
                  title="Surface"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreviewTheme(theme)}
                  data-testid={`preview-theme-${theme.name}`}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                
                {!theme.is_active && (
                  <Button
                    size="sm"
                    onClick={() => handleActivateTheme(theme.id)}
                    data-testid={`activate-theme-${theme.name}`}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Activate
                  </Button>
                )}
                
                {!theme.is_default && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTheme(theme)}
                      data-testid={`edit-theme-${theme.name}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTheme(theme.id)}
                      data-testid={`delete-theme-${theme.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {themes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No themes available. Create your first theme!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedThemeManager;
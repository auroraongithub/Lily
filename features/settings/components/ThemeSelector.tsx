"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { useTheme } from '../context/ThemeContext'
import { createCustomTheme, hexToHsl, applyTheme, type ThemeColors, type Theme } from '@/lib/themes'
import { Plus, Trash2, Palette, Check } from 'lucide-react'

export function ThemeSelector() {
  const { currentTheme, availableThemes, setTheme, createCustomTheme: saveCustomTheme, deleteCustomTheme } = useTheme()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newThemeName, setNewThemeName] = useState('')
  const [newThemeDescription, setNewThemeDescription] = useState('')
  const [customColors, setCustomColors] = useState<ThemeColors>({
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    primary: '221.2 83.2% 53.3%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96%',
    secondaryForeground: '222.2 84% 4.9%',
    muted: '210 40% 96%',
    mutedForeground: '215.4 16.3% 46.9%',
    accent: '210 40% 96%',
    accentForeground: '222.2 84% 4.9%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '210 40% 98%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '221.2 83.2% 53.3%',
  })
  
  // Store original theme for restoration on cancel
  const originalThemeRef = useRef<Theme | null>(null)

  const handleColorChange = (colorKey: keyof ThemeColors, hexValue: string) => {
    const hslValue = hexToHsl(hexValue)
    const newColors = {
      ...customColors,
      [colorKey]: hslValue
    }
    setCustomColors(newColors)
    
    // Apply live preview immediately
    const previewTheme: Theme = {
      id: 'preview',
      name: 'Preview',
      colors: newColors,
      isCustom: true
    }
    applyTheme(previewTheme)
  }

  // Handle opening the create form
  const handleOpenCreateForm = () => {
    // Store the current theme to restore later
    originalThemeRef.current = currentTheme
    setShowCreateForm(true)
  }

  // Handle canceling theme creation
  const handleCancelCreate = () => {
    // Restore original theme
    if (originalThemeRef.current) {
      applyTheme(originalThemeRef.current)
    }
    setShowCreateForm(false)
    setNewThemeName('')
    setNewThemeDescription('')
    // Reset to default light theme colors
    setCustomColors({
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      primary: '221.2 83.2% 53.3%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96%',
      secondaryForeground: '222.2 84% 4.9%',
      muted: '210 40% 96%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      accentForeground: '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '221.2 83.2% 53.3%',
    })
  }

  const handleCreateTheme = async () => {
    if (!newThemeName.trim()) return

    try {
      const theme = createCustomTheme(newThemeName.trim(), newThemeDescription.trim(), customColors)
      await saveCustomTheme(theme)
      setTheme(theme)
      
      // Reset form
      setShowCreateForm(false)
      setNewThemeName('')
      setNewThemeDescription('')
      originalThemeRef.current = null
    } catch (error) {
      console.error('Failed to create theme:', error)
    }
  }

  const handleDeleteTheme = async (themeId: string) => {
    if (confirm('Are you sure you want to delete this theme?')) {
      try {
        await deleteCustomTheme(themeId)
      } catch (error) {
        console.error('Failed to delete theme:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Theme Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableThemes.map((theme) => (
            <Card 
              key={theme.id}
              className={`p-4 cursor-pointer border-2 transition-all hover:shadow-md ${
                currentTheme.id === theme.id 
                  ? 'border-primary bg-accent/50' 
                  : 'border-border hover:border-muted-foreground'
              }`}
              onClick={() => setTheme(theme)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium flex items-center gap-2">
                    {theme.name}
                    {currentTheme.id === theme.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </h4>
                  {theme.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {theme.description}
                    </p>
                  )}
                </div>
                {theme.isCustom && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTheme(theme.id)
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* Color Preview */}
              <div className="flex gap-1">
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: `hsl(${theme.colors.background})` }}
                />
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                />
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
                />
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Custom Themes</h3>
          <Button 
            onClick={handleOpenCreateForm}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Theme
          </Button>
        </div>

        {showCreateForm && (
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Theme Name</label>
                <Input
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  placeholder="My Custom Theme"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                <Input
                  value={newThemeDescription}
                  onChange={(e) => setNewThemeDescription(e.target.value)}
                  placeholder="A beautiful theme for..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorPicker
                label="Background"
                value={`hsl(${customColors.background})`}
                onChange={(value) => handleColorChange('background', value)}
              />
              <ColorPicker
                label="Foreground"
                value={`hsl(${customColors.foreground})`}
                onChange={(value) => handleColorChange('foreground', value)}
              />
              <ColorPicker
                label="Primary"
                value={`hsl(${customColors.primary})`}
                onChange={(value) => handleColorChange('primary', value)}
              />
              <ColorPicker
                label="Secondary"
                value={`hsl(${customColors.secondary})`}
                onChange={(value) => handleColorChange('secondary', value)}
              />
              <ColorPicker
                label="Accent"
                value={`hsl(${customColors.accent})`}
                onChange={(value) => handleColorChange('accent', value)}
              />
              <ColorPicker
                label="Border"
                value={`hsl(${customColors.border})`}
                onChange={(value) => handleColorChange('border', value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleCancelCreate}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTheme}
                disabled={!newThemeName.trim()}
                className="gap-2"
              >
                <Palette className="w-4 h-4" />
                Create Theme
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

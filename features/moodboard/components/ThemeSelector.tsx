"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ChevronDown, Plus, X } from 'lucide-react'
import type { MoodboardTheme, ID } from '@/lib/types'

interface ThemeSelectorProps {
  themes: MoodboardTheme[]
  selectedTheme: ID | null
  onThemeChange: (themeId: ID | null) => void
  onAddTheme?: (name: string, color: string, icon?: string) => void
}

export function ThemeSelector({ 
  themes, 
  selectedTheme, 
  onThemeChange,
  onAddTheme 
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newThemeName, setNewThemeName] = useState('')
  const [newThemeColor, setNewThemeColor] = useState('#3b82f6')
  const [newThemeIcon, setNewThemeIcon] = useState('🏷️')

  const selectedThemeData = selectedTheme 
    ? themes.find(t => t.id === selectedTheme)
    : null

  const handleAddTheme = async () => {
    if (!newThemeName.trim() || !onAddTheme) return

    try {
      await onAddTheme(newThemeName, newThemeColor, newThemeIcon)
      setNewThemeName('')
      setNewThemeColor('#3b82f6')
      setNewThemeIcon('🏷️')
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding theme:', error)
    }
  }

  const handleCancelAdd = () => {
    setNewThemeName('')
    setNewThemeColor('#3b82f6') 
    setNewThemeIcon('🏷️')
    setShowAddForm(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="gap-2 min-w-[140px] justify-start"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedThemeData ? (
          <>
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: selectedThemeData.color }}
            />
            <span className="flex-1 text-left truncate">
              {selectedThemeData.icon} {selectedThemeData.name}
            </span>
          </>
        ) : (
          <span className="flex-1 text-left text-muted-foreground">
            All Themes
          </span>
        )}
        <ChevronDown className="h-4 w-4 ml-auto" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-popover border rounded-md shadow-lg z-20 min-w-[200px]">
          <div className="p-1">
            {/* All Themes Option */}
            <button
              className={cn(
                "w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded",
                !selectedTheme && "bg-accent"
              )}
              onClick={() => {
                onThemeChange(null)
                setIsOpen(false)
              }}
            >
              <div className="w-3 h-3 rounded border-2 border-muted-foreground/30" />
              <span>All Themes</span>
              {!selectedTheme && (
                <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
              )}
            </button>

            <div className="border-t my-1" />

            {/* Theme List */}
            {themes.map((theme) => (
              <button
                key={theme.id}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded",
                  selectedTheme === theme.id && "bg-accent"
                )}
                onClick={() => {
                  onThemeChange(theme.id)
                  setIsOpen(false)
                }}
              >
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: theme.color }}
                />
                <span className="flex-1 text-left">
                  {theme.icon} {theme.name}
                </span>
                {selectedTheme === theme.id && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
            ))}

            {/* Add New Theme */}
            {onAddTheme && (
              <>
                <div className="border-t my-1" />
                
                {showAddForm ? (
                  <div className="p-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newThemeIcon}
                        onChange={(e) => setNewThemeIcon(e.target.value)}
                        className="w-8 text-center border rounded px-1 py-1 text-sm"
                        placeholder="🏷️"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        value={newThemeName}
                        onChange={(e) => setNewThemeName(e.target.value)}
                        className="flex-1 border rounded px-2 py-1 text-sm"
                        placeholder="Theme name"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTheme()
                          if (e.key === 'Escape') handleCancelAdd()
                        }}
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newThemeColor}
                        onChange={(e) => setNewThemeColor(e.target.value)}
                        className="w-8 h-6 border rounded cursor-pointer"
                      />
                      <div className="flex gap-1 ml-auto">
                        <Button
                          size="sm"
                          onClick={handleAddTheme}
                          disabled={!newThemeName.trim()}
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelAdd}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    className="w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded text-muted-foreground"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add New Theme</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

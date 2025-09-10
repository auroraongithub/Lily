"use client"

import React, { useState, useMemo } from 'react'
import { useKeyboardShortcuts } from '../context/KeyboardShortcutsContext'
import { useTheme } from '../context/ThemeContext'
import { ShortcutInput } from '@/components/ui/ShortcutInput'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { KeyboardShortcut } from '@/lib/types'
import { RotateCcw, Search, AlertTriangle } from 'lucide-react'

export function KeyboardShortcutsManager() {
  const {
    shortcuts,
    updateShortcut,
    resetToDefaults,
    resetShortcut,
    getConflicts,
    isLoading,
  } = useKeyboardShortcuts()
  
  const { currentTheme } = useTheme()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Group shortcuts by category
  const categorizedShortcuts = useMemo(() => {
    const categories: Record<string, KeyboardShortcut[]> = {
      editor: [],
      navigation: [],
      general: [],
    }

    Object.values(shortcuts).forEach(shortcut => {
      categories[shortcut.category].push(shortcut)
    })

    // Sort shortcuts within each category
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => a.name.localeCompare(b.name))
    })

    return categories
  }, [shortcuts])

  // Filter shortcuts based on search and category
  const filteredShortcuts = useMemo(() => {
    let allShortcuts: KeyboardShortcut[] = []
    
    if (selectedCategory === 'all') {
      allShortcuts = Object.values(shortcuts)
    } else {
      allShortcuts = categorizedShortcuts[selectedCategory] || []
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      allShortcuts = allShortcuts.filter(shortcut => 
        shortcut.name.toLowerCase().includes(term) ||
        shortcut.description.toLowerCase().includes(term) ||
        shortcut.keys.toLowerCase().includes(term)
      )
    }

    return allShortcuts
  }, [shortcuts, categorizedShortcuts, selectedCategory, searchTerm])

  // Get all conflicts in the current shortcuts
  const allConflicts = useMemo(() => {
    const conflicts: Record<string, string[]> = {}
    
    Object.values(shortcuts).forEach(shortcut => {
      if (!shortcut.keys) return
      
      const shortcutConflicts = getConflicts(shortcut.keys, shortcut.id)
      if (shortcutConflicts.length > 0) {
        conflicts[shortcut.id] = shortcutConflicts.map(c => c.conflictingId)
      }
    })
    
    return conflicts
  }, [shortcuts, getConflicts])

  const handleShortcutChange = (shortcutId: string, keys: string) => {
    updateShortcut(shortcutId, keys)
  }

  const handleShortcutReset = (shortcutId: string) => {
    resetShortcut(shortcutId)
  }

  const categoryLabels: Record<string, string> = {
    all: 'All Shortcuts',
    editor: 'Text Editor',
    navigation: 'Navigation',
    general: 'General',
  }

  // Theme-aware category colors
  const getCategoryColor = (category: string) => {
    const colors = {
      editor: 'hsl(var(--primary))',
      navigation: 'hsl(142 76% 36%)', // Green
      general: 'hsl(262 83% 58%)', // Purple
    }
    return colors[category as keyof typeof colors] || 'hsl(var(--muted-foreground))'
  }

  const getCategoryBackgroundColor = (category: string) => {
    const colors = {
      editor: 'hsl(var(--primary) / 0.1)',
      navigation: 'hsl(142 76% 36% / 0.1)', // Green with opacity
      general: 'hsl(262 83% 58% / 0.1)', // Purple with opacity
    }
    return colors[category as keyof typeof colors] || 'hsl(var(--muted) / 0.5)'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div 
            className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full mx-auto mb-2"
            style={{ borderColor: `hsl(var(--primary))`, borderTopColor: 'transparent' }}
          ></div>
          <p className="text-sm text-muted-foreground">Loading shortcuts...</p>
        </div>
      </div>
    )
  }

  const totalConflicts = Object.keys(allConflicts).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Keyboard Shortcuts
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize keyboard shortcuts to match your workflow
          </p>
        </div>
        <Button
          onClick={resetToDefaults}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset All
        </Button>
      </div>

      {/* Conflict Warning */}
      {totalConflicts > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <div className="flex items-center gap-3 p-4">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Shortcut Conflicts Detected
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                {totalConflicts} shortcut{totalConflicts > 1 ? 's have' : ' has'} conflicting key combinations.
                Please resolve these conflicts for proper functionality.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Button
              key={key}
              onClick={() => setSelectedCategory(key)}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              className="text-xs"
            >
              {label}
              {key !== 'all' && (
                <span className="ml-1 text-xs opacity-70">
                  ({categorizedShortcuts[key]?.length || 0})
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Shortcuts List */}
      <div className="space-y-4">
        {filteredShortcuts.length === 0 ? (
          <Card>
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'No shortcuts match your search.' : 'No shortcuts found.'}
              </p>
            </div>
          </Card>
        ) : (
          filteredShortcuts.map((shortcut) => {
            const hasConflict = allConflicts[shortcut.id]?.length > 0
            const conflictingShortcuts = hasConflict 
              ? allConflicts[shortcut.id].map(id => shortcuts[id]?.name).filter(Boolean)
              : []
            
            return (
              <Card key={shortcut.id} className={hasConflict ? 'border-red-200 dark:border-red-800' : ''}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">
                          {shortcut.name}
                        </h3>
                        <span 
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: getCategoryBackgroundColor(shortcut.category),
                            color: getCategoryColor(shortcut.category)
                          }}
                        >
                          {categoryLabels[shortcut.category] || shortcut.category}
                        </span>
                        {!shortcut.isEditable && (
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {shortcut.description}
                      </p>
                      
                      {hasConflict && (
                        <p className="text-xs text-destructive mb-2">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Conflicts with: {conflictingShortcuts.join(', ')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0 w-48">
                      <ShortcutInput
                        value={shortcut.keys}
                        onChange={(keys) => handleShortcutChange(shortcut.id, keys)}
                        onReset={shortcut.isEditable ? () => handleShortcutReset(shortcut.id) : undefined}
                        disabled={!shortcut.isEditable}
                        hasConflict={hasConflict}
                        conflictMessage={hasConflict ? `Conflicts with ${conflictingShortcuts.join(', ')}` : undefined}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="text-xs text-muted-foreground border-t border-border pt-4">
        <p>
          • System shortcuts (like Tab and Shift+Tab) cannot be modified
          <br />
          • Use Ctrl on Windows/Linux or Cmd on Mac for modifier keys
          <br />
          • Click on a shortcut field to record a new key combination
        </p>
      </div>
    </div>
  )
}

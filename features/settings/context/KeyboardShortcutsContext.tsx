"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { KeyboardShortcut, KeyboardShortcuts, KeyboardShortcutConflict } from '@/lib/types'

interface KeyboardShortcutsContextValue {
  shortcuts: KeyboardShortcuts
  updateShortcut: (id: string, keys: string) => void
  resetToDefaults: () => void
  resetShortcut: (id: string) => void
  getConflicts: (keys: string, excludeId?: string) => KeyboardShortcutConflict[]
  getShortcutByKeys: (keys: string) => KeyboardShortcut | undefined
  isLoading: boolean
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | undefined>(undefined)

const SHORTCUTS_STORAGE_KEY = 'lily:keyboard-shortcuts'

// Default keyboard shortcuts
const defaultShortcuts: KeyboardShortcuts = {
  'save': {
    id: 'save',
    name: 'Save Document',
    description: 'Save the current document',
    category: 'general',
    defaultKeys: 'Ctrl+S',
    keys: 'Ctrl+S',
    action: 'editor:save-now',
    isEditable: true,
  },
  'bold': {
    id: 'bold',
    name: 'Bold Text',
    description: 'Format selected text as bold',
    category: 'editor',
    defaultKeys: 'Ctrl+B',
    keys: 'Ctrl+B',
    action: 'editor:format-bold',
    isEditable: true,
  },
  'italic': {
    id: 'italic',
    name: 'Italic Text',
    description: 'Format selected text as italic',
    category: 'editor',
    defaultKeys: 'Ctrl+I',
    keys: 'Ctrl+I',
    action: 'editor:format-italic',
    isEditable: true,
  },
  'underline': {
    id: 'underline',
    name: 'Underline Text',
    description: 'Format selected text as underline',
    category: 'editor',
    defaultKeys: 'Ctrl+U',
    keys: 'Ctrl+U',
    action: 'editor:format-underline',
    isEditable: true,
  },
  'strikethrough': {
    id: 'strikethrough',
    name: 'Strikethrough Text',
    description: 'Format selected text as strikethrough',
    category: 'editor',
    defaultKeys: 'Ctrl+Shift+X',
    keys: 'Ctrl+Shift+X',
    action: 'editor:format-strikethrough',
    isEditable: true,
  },
  'strikethrough-alt': {
    id: 'strikethrough-alt',
    name: 'Strikethrough (Alternative)',
    description: 'Alternative strikethrough shortcut',
    category: 'editor',
    defaultKeys: 'Alt+Shift+5',
    keys: 'Alt+Shift+5',
    action: 'editor:format-strikethrough',
    isEditable: true,
  },
  'indent': {
    id: 'indent',
    name: 'Indent',
    description: 'Indent current line or selection',
    category: 'editor',
    defaultKeys: 'Tab',
    keys: 'Tab',
    action: 'editor:indent',
    isEditable: false, // Tab is fundamental
  },
  'outdent': {
    id: 'outdent',
    name: 'Outdent',
    description: 'Outdent current line or selection',
    category: 'editor',
    defaultKeys: 'Shift+Tab',
    keys: 'Shift+Tab',
    action: 'editor:outdent',
    isEditable: false, // Shift+Tab is fundamental
  },
  'undo': {
    id: 'undo',
    name: 'Undo',
    description: 'Undo last action',
    category: 'general',
    defaultKeys: 'Ctrl+Z',
    keys: 'Ctrl+Z',
    action: 'editor:undo',
    isEditable: false, // Core functionality
  },
  'redo': {
    id: 'redo',
    name: 'Redo',
    description: 'Redo last undone action',
    category: 'general',
    defaultKeys: 'Ctrl+Y',
    keys: 'Ctrl+Y',
    action: 'editor:redo',
    isEditable: false, // Core functionality
  },
}

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcuts>(defaultShortcuts)
  const [isLoading, setIsLoading] = useState(true)

  // Load shortcuts from localStorage on mount
  useEffect(() => {
    const loadShortcuts = async () => {
      try {
        const savedShortcuts = localStorage.getItem(SHORTCUTS_STORAGE_KEY)
        if (savedShortcuts) {
          const parsed = JSON.parse(savedShortcuts)
          // Merge with defaults to handle new shortcuts added in updates
          const merged = { ...defaultShortcuts }
          Object.keys(parsed).forEach(key => {
            if (merged[key]) {
              merged[key] = { ...merged[key], keys: parsed[key].keys }
            }
          })
          setShortcuts(merged)
        }
      } catch (error) {
        console.warn('Failed to load keyboard shortcuts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadShortcuts()
  }, [])

  // Persist shortcuts to localStorage
  const persistShortcuts = useCallback((newShortcuts: KeyboardShortcuts) => {
    try {
      localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(newShortcuts))
    } catch (error) {
      console.warn('Failed to save keyboard shortcuts:', error)
    }
  }, [])

  // Parse key combination for comparison
  const normalizeKeys = useCallback((keys: string): string => {
    return keys
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/cmd/g, 'ctrl') // Normalize Cmd to Ctrl for comparison
      .split('+')
      .sort()
      .join('+')
  }, [])

  // Check for conflicts
  const getConflicts = useCallback((keys: string, excludeId?: string): KeyboardShortcutConflict[] => {
    const normalizedKeys = normalizeKeys(keys)
    const conflicts: KeyboardShortcutConflict[] = []
    
    Object.values(shortcuts).forEach(shortcut => {
      if (shortcut.id !== excludeId && normalizeKeys(shortcut.keys) === normalizedKeys) {
        conflicts.push({
          shortcutId: excludeId || '',
          conflictingId: shortcut.id,
          keys: shortcut.keys,
        })
      }
    })
    
    return conflicts
  }, [shortcuts, normalizeKeys])

  // Get shortcut by key combination
  const getShortcutByKeys = useCallback((keys: string): KeyboardShortcut | undefined => {
    const normalizedKeys = normalizeKeys(keys)
    return Object.values(shortcuts).find(shortcut => 
      normalizeKeys(shortcut.keys) === normalizedKeys
    )
  }, [shortcuts, normalizeKeys])

  // Update a shortcut
  const updateShortcut = useCallback((id: string, keys: string) => {
    setShortcuts(prev => {
      const updated = {
        ...prev,
        [id]: {
          ...prev[id]!,
          keys,
        },
      }
      persistShortcuts(updated)
      return updated
    })
  }, [persistShortcuts])

  // Reset all shortcuts to defaults
  const resetToDefaults = useCallback(() => {
    setShortcuts(defaultShortcuts)
    persistShortcuts(defaultShortcuts)
  }, [persistShortcuts])

  // Reset a single shortcut to default
  const resetShortcut = useCallback((id: string) => {
    const defaultShortcut = defaultShortcuts[id]
    if (defaultShortcut) {
      updateShortcut(id, defaultShortcut.defaultKeys)
    }
  }, [updateShortcut])

  const value: KeyboardShortcutsContextValue = {
    shortcuts,
    updateShortcut,
    resetToDefaults,
    resetShortcut,
    getConflicts,
    getShortcutByKeys,
    isLoading,
  }

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  )
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext)
  if (context === undefined) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider')
  }
  return context
}

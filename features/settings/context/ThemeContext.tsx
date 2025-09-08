"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { Theme, defaultThemes, applyTheme } from '@/lib/themes'
import { db } from '@/lib/db'

interface ThemeContextValue {
  currentTheme: Theme
  availableThemes: Theme[]
  setTheme: (theme: Theme) => void
  createCustomTheme: (theme: Theme) => Promise<void>
  deleteCustomTheme: (themeId: string) => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_STORAGE_KEY = 'lily:current-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultThemes[0]!)
  const [availableThemes, setAvailableThemes] = useState<Theme[]>(defaultThemes)
  const [isLoading, setIsLoading] = useState(true)

  // Load theme from localStorage and custom themes from database on mount
  useEffect(() => {
    const loadThemes = async () => {
      try {
        // Load custom themes from database
        const customThemes = await db.themes.toArray()
        const allThemes = [
          ...defaultThemes,
          ...customThemes.map(dbTheme => ({
            id: dbTheme.id,
            name: dbTheme.name,
            description: (dbTheme.data as any)?.description || '',
            colors: (dbTheme.data as any)?.colors || defaultThemes[0]!.colors,
            isCustom: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Theme))
        ]
        
        setAvailableThemes(allThemes)

        // Load saved theme preference
        const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY)
        if (savedThemeId) {
          const savedTheme = allThemes.find(theme => theme.id === savedThemeId)
          if (savedTheme) {
            setCurrentTheme(savedTheme)
            applyTheme(savedTheme)
          } else {
            applyTheme(defaultThemes[0])
          }
        } else {
          // Apply default theme
          applyTheme(defaultThemes[0])
        }
      } catch (error) {
        console.warn('Failed to load themes:', error)
        // Fall back to default theme
        applyTheme(defaultThemes[0])
      } finally {
        setIsLoading(false)
      }
    }

    loadThemes()
  }, [])

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme)
    applyTheme(theme)
    
    // Add smooth transition class
    document.documentElement.classList.add('theme-transition')
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 300)

    // Persist to localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.id)
    } catch (error) {
      console.warn('Failed to save theme preference:', error)
    }
  }

  const createCustomTheme = async (theme: Theme) => {
    try {
      // Save to database
      await db.themes.add({
        id: theme.id,
        name: theme.name,
        data: {
          description: theme.description || '',
          colors: theme.colors,
        } as any,
      })

      // Update available themes
      setAvailableThemes(prev => [...prev, theme])
    } catch (error) {
      console.error('Failed to create custom theme:', error)
      throw error
    }
  }

  const deleteCustomTheme = async (themeId: string) => {
    try {
      await db.themes.delete(themeId)
      
      // Update available themes
      setAvailableThemes(prev => prev.filter(theme => theme.id !== themeId))
      
      // If the deleted theme was current, switch to default
      if (currentTheme.id === themeId) {
        setTheme(defaultThemes[0]!)
      }
    } catch (error) {
      console.error('Failed to delete custom theme:', error)
      throw error
    }
  }

  const value: ThemeContextValue = {
    currentTheme,
    availableThemes,
    setTheme,
    createCustomTheme,
    deleteCustomTheme,
    isLoading,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

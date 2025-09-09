import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/db'
import type { MoodboardItem, MoodboardTheme, MoodboardWorkspace, ID } from '@/lib/types'
import { generateId } from '@/lib/utils'

export function useMoodboard(projectId: ID) {
  const [items, setItems] = useState<MoodboardItem[]>([])
  const [themes, setThemes] = useState<MoodboardTheme[]>([])
  const [workspace, setWorkspace] = useState<MoodboardWorkspace | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<ID | null>(null)
  const [loading, setLoading] = useState(true)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load workspace (create default if none exists)
        let ws = await db.moodboardWorkspaces.where({ projectId }).first()
        if (!ws) {
          ws = {
            id: generateId(),
            projectId,
            name: 'Default Moodboard',
            viewMode: 'grid',
            gridColumns: 4,
            zoomLevel: 1,
            viewportPosition: { x: 0, y: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          await db.moodboardWorkspaces.add(ws)
        }
        setWorkspace(ws)

        // Load themes (create defaults if none exist)
        const existingThemes = await db.moodboardThemes.where({ projectId }).toArray()
        if (existingThemes.length === 0) {
          const defaultThemes: MoodboardTheme[] = [
            {
              id: generateId(),
              projectId,
              name: 'Characters',
              color: '#3b82f6',
              icon: '👥',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: generateId(),
              projectId,
              name: 'Places',
              color: '#10b981',
              icon: '🏞️',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: generateId(),
              projectId,
              name: 'Mood & Atmosphere',
              color: '#8b5cf6',
              icon: '🌙',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: generateId(),
              projectId,
              name: 'Objects & Props',
              color: '#f59e0b',
              icon: '⚔️',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]
          await db.moodboardThemes.bulkAdd(defaultThemes)
          setThemes(defaultThemes)
        } else {
          setThemes(existingThemes)
        }

        // Load items
        const allItems = await db.moodboardItems.where({ projectId }).toArray()
        setItems(allItems)
      } catch (error) {
        console.error('Error loading moodboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [projectId])

  // Add item
  const addItem = useCallback(async (
    file: File,
    themeId?: ID,
    position?: { x: number; y: number }
  ) => {
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      const newItem: MoodboardItem = {
        id: generateId(),
        projectId,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        imageUrl: base64,
        imageName: file.name,
        imageSize: file.size,
        themeId,
        position: position || { x: 0, y: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await db.moodboardItems.add(newItem)
      setItems(prev => [...prev, newItem])
      return newItem
    } catch (error) {
      console.error('Error adding moodboard item:', error)
      throw error
    }
  }, [projectId])

  // Update item
  const updateItem = useCallback(async (id: ID, updates: Partial<MoodboardItem>) => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      
      await db.moodboardItems.update(id, updatedData)
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updatedData } : item
      ))
    } catch (error) {
      console.error('Error updating moodboard item:', error)
      throw error
    }
  }, [])

  // Delete item
  const deleteItem = useCallback(async (id: ID) => {
    try {
      await db.moodboardItems.delete(id)
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting moodboard item:', error)
      throw error
    }
  }, [])

  // Add theme
  const addTheme = useCallback(async (name: string, color: string, icon?: string) => {
    try {
      const newTheme: MoodboardTheme = {
        id: generateId(),
        projectId,
        name,
        color,
        icon,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await db.moodboardThemes.add(newTheme)
      setThemes(prev => [...prev, newTheme])
      return newTheme
    } catch (error) {
      console.error('Error adding theme:', error)
      throw error
    }
  }, [projectId])

  // Update workspace
  const updateWorkspace = useCallback(async (updates: Partial<MoodboardWorkspace>) => {
    if (!workspace) return

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      
      await db.moodboardWorkspaces.update(workspace.id, updatedData)
      setWorkspace(prev => prev ? { ...prev, ...updatedData } : null)
    } catch (error) {
      console.error('Error updating workspace:', error)
      throw error
    }
  }, [workspace])

  // Filter items by theme
  const filteredItems = selectedTheme 
    ? items.filter(item => item.themeId === selectedTheme)
    : items

  return {
    items: filteredItems,
    allItems: items,
    themes,
    workspace,
    selectedTheme,
    loading,
    setSelectedTheme,
    addItem,
    updateItem,
    deleteItem,
    addTheme,
    updateWorkspace,
  }
}

"use client"

import { useState, useCallback } from 'react'
import { useMoodboard } from '../hooks/useMoodboard'
import { useProjectContext } from '@/features/projects/context/ProjectContext'
import { MoodboardCard } from './MoodboardCard'
import { MoodboardUpload } from './MoodboardUpload'
import { ThemeSelector } from './ThemeSelector'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { Grid, List, Plus } from 'lucide-react'
import type { MoodboardItem, ID } from '@/lib/types'

interface MoodboardGridProps {
  className?: string
}

export function MoodboardGrid({ className }: MoodboardGridProps) {
  const { currentProject } = useProjectContext()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUpload, setShowUpload] = useState(false)

  const {
    items,
    themes,
    workspace,
    selectedTheme,
    loading,
    setSelectedTheme,
    addItem,
    updateItem,
    deleteItem,
    updateWorkspace,
  } = useMoodboard(currentProject?.id || '')

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (!currentProject) return

    try {
      const promises = files.map((file, index) => {
        const position = {
          x: (index % 4) * 250 + 50,
          y: Math.floor(index / 4) * 200 + 50,
        }
        return addItem(file, selectedTheme || undefined, position)
      })
      
      await Promise.all(promises)
      setShowUpload(false)
    } catch (error) {
      console.error('Error uploading files:', error)
    }
  }, [currentProject, addItem, selectedTheme])

  const handleItemUpdate = useCallback((id: ID, updates: Partial<MoodboardItem>) => {
    updateItem(id, updates)
  }, [updateItem])

  const handleItemDelete = useCallback((id: ID) => {
    deleteItem(id)
  }, [deleteItem])

  const handleThemeChange = useCallback((themeId: ID | null) => {
    setSelectedTheme(themeId)
  }, [setSelectedTheme])

  const gridColumns = workspace?.gridColumns || 4

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading moodboard...</div>
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Please select a project to view moodboard</div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Moodboard</h1>
          <ThemeSelector
            themes={themes}
            selectedTheme={selectedTheme}
            onThemeChange={handleThemeChange}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none border-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none border-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Button */}
          <Button
            onClick={() => setShowUpload(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Images
          </Button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <MoodboardUpload
          onUpload={handleFileUpload}
          onCancel={() => setShowUpload(false)}
          selectedTheme={selectedTheme}
          themes={themes}
        />
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold mb-2">No images yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your moodboard by adding some inspiration images
            </p>
            <Button onClick={() => setShowUpload(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Image
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${gridColumns}, minmax(200px, 1fr))`,
            }}
          >
            {items.map((item) => (
              <MoodboardCard
                key={item.id}
                item={item}
                themes={themes}
                onUpdate={handleItemUpdate}
                onDelete={handleItemDelete}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <MoodboardCard
                key={item.id}
                item={item}
                themes={themes}
                onUpdate={handleItemUpdate}
                onDelete={handleItemDelete}
                variant="list"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

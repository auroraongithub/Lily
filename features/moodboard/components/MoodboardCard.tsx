"use client"

import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { MoreHorizontal, Edit2, Trash2, Palette, Tag, X } from 'lucide-react'
import type { MoodboardItem, MoodboardTheme, ID } from '@/lib/types'
import { extractColorsFromImage } from '../utils/colorExtraction'

interface MoodboardCardProps {
  item: MoodboardItem
  themes: MoodboardTheme[]
  onUpdate: (id: ID, updates: Partial<MoodboardItem>) => void
  onDelete: (id: ID) => void
  variant?: 'grid' | 'list'
}

export function MoodboardCard({ 
  item, 
  themes, 
  onUpdate, 
  onDelete, 
  variant = 'grid' 
}: MoodboardCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editDescription, setEditDescription] = useState(item.description || '')
  const [showMenu, setShowMenu] = useState(false)
  const [showColorPalette, setShowColorPalette] = useState(false)
  const [extractingColors, setExtractingColors] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  const currentTheme = item.themeId ? themes.find(t => t.id === item.themeId) : null

  const handleSaveEdit = useCallback(() => {
    onUpdate(item.id, {
      name: editName,
      description: editDescription,
    })
    setIsEditing(false)
  }, [item.id, editName, editDescription, onUpdate])

  const handleCancelEdit = useCallback(() => {
    setEditName(item.name)
    setEditDescription(item.description || '')
    setIsEditing(false)
  }, [item.name, item.description])

  const handleThemeChange = useCallback((themeId: ID | null) => {
    onUpdate(item.id, { themeId: themeId || undefined })
    setShowMenu(false)
  }, [item.id, onUpdate])

  const handleExtractColors = useCallback(async () => {
    if (!item.imageUrl || extractingColors) return
    
    try {
      setExtractingColors(true)
      const colors = await extractColorsFromImage(item.imageUrl, 6)
      onUpdate(item.id, { colorPalette: colors })
      setShowColorPalette(true)
    } catch (error) {
      console.error('Error extracting colors:', error)
    } finally {
      setExtractingColors(false)
    }
  }, [item.imageUrl, item.id, onUpdate, extractingColors])

  const handleDelete = useCallback(() => {
    if (confirm(`Delete "${item.name}"?`)) {
      onDelete(item.id)
    }
    setShowMenu(false)
  }, [item.id, item.name, onDelete])

  if (variant === 'list') {
    return (
      <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-16 h-16 object-cover rounded"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Image name"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
                placeholder="Description (optional)"
              />
            </div>
          ) : (
            <div>
              <h4 className="font-medium text-sm truncate">{item.name}</h4>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {item.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Theme Badge */}
        {currentTheme && (
          <div className="flex-shrink-0">
            <div 
              className="px-2 py-1 rounded text-xs font-medium text-white"
              style={{ backgroundColor: currentTheme.color }}
            >
              {currentTheme.icon} {currentTheme.name}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="group relative bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all moodboard-card">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover moodboard-image cursor-pointer"
          onClick={() => setShowImageModal(true)}
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-black"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {/* Context Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[180px] context-menu">
                  <div className="p-1">
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded"
                      onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit Details
                    </button>
                    
                    <button
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded",
                        extractingColors && 'extracting-colors'
                      )}
                      onClick={handleExtractColors}
                      disabled={extractingColors}
                    >
                      <Palette className="h-3 w-3" />
                      {extractingColors ? 'Extracting...' : 'Extract Colors'}
                    </button>

                    <div className="border-t my-1" />

                    {/* Theme Selection */}
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      Assign to Theme:
                    </div>
                    <button
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded",
                        !currentTheme && "bg-accent"
                      )}
                      onClick={() => handleThemeChange(null)}
                    >
                      <div className="w-3 h-3 rounded border bg-muted" />
                      No Theme
                    </button>
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded",
                          currentTheme?.id === theme.id && "bg-accent"
                        )}
                        onClick={() => handleThemeChange(theme.id)}
                      >
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: theme.color }}
                        />
                        {theme.icon} {theme.name}
                      </button>
                    ))}

                    <div className="border-t my-1" />
                    
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Theme Badge */}
        {currentTheme && (
          <div className="absolute bottom-2 left-2">
            <div 
              className="px-2 py-1 rounded text-xs font-medium text-white shadow-sm theme-badge"
              style={{ backgroundColor: currentTheme.color }}
            >
              {currentTheme.icon} {currentTheme.name}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Image name"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={2}
              placeholder="Description (optional)"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="font-medium text-sm leading-tight mb-1">{item.name}</h4>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        )}

        {/* Color Palette */}
        {showColorPalette && item.colorPalette && item.colorPalette.length > 0 && (
          <div className="mt-2 pt-2 border-t color-palette">
            <div className="text-xs text-muted-foreground mb-1">Color Palette:</div>
            <div className="flex gap-1">
              {item.colorPalette.map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Image Modal - Rendered as Portal */}
      {showImageModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setShowImageModal(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-4 rounded-b-lg">
              <h3 className="font-semibold">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-gray-200 mt-1">{item.description}</p>
              )}
            </div>
          </div>
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setShowImageModal(false)}
          />
        </div>,
        document.body
      )}
    </div>
  )
}

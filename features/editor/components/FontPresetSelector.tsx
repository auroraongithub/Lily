"use client"

import { useState } from 'react'
import { ChevronDown, Type } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { FontPreset } from '../types'

interface FontPresetSelectorProps {
  currentPreset: FontPreset
  onPresetChange: (preset: FontPreset) => void
  className?: string
}

const FONT_PRESETS = [
  {
    id: 'serif' as FontPreset,
    name: 'Serif',
    description: 'Classic and readable',
    fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
    preview: 'Ag'
  },
  {
    id: 'sans' as FontPreset,
    name: 'Sans Serif', 
    description: 'Modern and clean',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    preview: 'Ag'
  },
  {
    id: 'mono' as FontPreset,
    name: 'Monospace',
    description: 'Code-style font',
    fontFamily: 'ui-monospace, "Fira Code", "Cascadia Code", Consolas, monospace',
    preview: 'Ag'
  },
  {
    id: 'handwriting' as FontPreset,
    name: 'Handwriting',
    description: 'Personal and casual',
    fontFamily: '"Kalam", "Comic Sans MS", cursive',
    preview: 'Ag'
  }
]

export function FontPresetSelector({ currentPreset, onPresetChange, className }: FontPresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const currentPresetInfo = FONT_PRESETS.find(p => p.id === currentPreset) ?? FONT_PRESETS[0]!

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-2 min-w-[100px] justify-between"
        title="Font Preset"
      >
        <div className="flex items-center gap-2">
          <Type className="h-3 w-3" />
          <span className="text-sm">{currentPresetInfo.name}</span>
        </div>
        <ChevronDown className="h-3 w-3 ml-1" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 z-20 mt-1 w-64 bg-popover rounded-md shadow-md toolbar-dropdown">
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Font Presets
              </div>
              {FONT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onPresetChange(preset.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full p-2 text-left hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors',
                    preset.id === currentPreset && 'bg-accent text-accent-foreground'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-muted-foreground">{preset.description}</div>
                    </div>
                    <div 
                      className="text-xl font-medium"
                      style={{ fontFamily: preset.fontFamily }}
                    >
                      {preset.preview}
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Custom font option placeholder */}
              <div className="mt-2 pt-2">
                <button
                  className="w-full p-2 text-left hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors text-sm text-muted-foreground"
                  disabled
                  title="Custom fonts coming soon"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Custom Font</div>
                      <div className="text-xs">Define your own font</div>
                    </div>
                    <div className="text-xs bg-muted px-2 py-1 rounded">
                      Soon
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

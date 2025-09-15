"use client"

import { useState } from 'react'
import { Palette } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface TextColorPickerProps {
  currentColor: string
  onColorChange: (color: string) => void
  className?: string
}

const PRESET_COLORS = [
  '#000000', // Black
  '#374151', // Gray 700
  '#6B7280', // Gray 500
  '#DC2626', // Red 600
  '#EA580C', // Orange 600
  '#D97706', // Amber 600
  '#65A30D', // Lime 600
  '#16A34A', // Green 600
  '#059669', // Emerald 600
  '#0891B2', // Cyan 600
  '#0284C7', // Sky 600
  '#2563EB', // Blue 600
  '#7C3AED', // Violet 600
  '#C026D3', // Fuchsia 600
  '#DC2626', // Rose 600
  '#1F2937', // Gray 800
]

export function TextColorPicker({ currentColor, onColorChange, className }: TextColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-2 relative"
        title="Text Color"
      >
        <Palette className="h-5 w-5" />
        {/* Color indicator bar */}
        <div 
          className="absolute bottom-0 left-1 right-1 h-0.5 rounded"
          style={{ backgroundColor: currentColor }}
        />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Color palette dropdown */}
          <div className="absolute top-full left-0 z-20 mt-1 p-3 bg-popover rounded-md shadow-md toolbar-dropdown">
            <div className="grid grid-cols-4 gap-1 w-32">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onColorChange(color)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-6 h-6 rounded hover:scale-110 transition-transform ring-offset-0',
                    color === currentColor ? 'ring-2 ring-ring' : 'ring-0'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            
            {/* Custom color input */}
            <div className="mt-3 pt-2">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => {
                  onColorChange(e.target.value)
                  setIsOpen(false)
                }}
                className="w-full h-8 rounded cursor-pointer ring-1 ring-input"
                title="Custom Color"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

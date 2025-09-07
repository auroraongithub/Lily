"use client"

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface FontSizeSelectorProps {
  currentSize: number
  onSizeChange: (size: number) => void
  className?: string
}

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72]

export function FontSizeSelector({ currentSize, onSizeChange, className }: FontSizeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-2 min-w-[60px] justify-between"
        title="Font Size"
      >
        <span className="text-sm">{currentSize}</span>
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
          <div className="absolute top-full left-0 z-20 mt-1 w-16 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto toolbar-dropdown">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => {
                  onSizeChange(size)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground',
                  size === currentSize && 'bg-accent text-accent-foreground'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

"use client"

import { useState } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hexValue, setHexValue] = useState(value)

  const handleColorChange = (newValue: string) => {
    setHexValue(newValue)
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-10"
          >
            <div 
              className="w-4 h-4 rounded border border-border"
              style={{ backgroundColor: value }}
            />
            <span>{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <input
                type="color"
                value={value}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-10 rounded border border-border cursor-pointer"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Hex Value</label>
              <Input
                value={hexValue}
                onChange={(e) => setHexValue(e.target.value)}
                onBlur={() => {
                  if (hexValue.match(/^#[0-9A-F]{6}$/i)) {
                    onChange(hexValue)
                  } else {
                    setHexValue(value)
                  }
                }}
                placeholder="#000000"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

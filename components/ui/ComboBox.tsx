"use client"

import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComboBoxOption {
  value: string
  label: string
  group?: string
}

interface ComboBoxProps {
  value?: string
  placeholder?: string
  options: ComboBoxOption[]
  onSelect: (value: string) => void
  className?: string
  searchPlaceholder?: string
}

export function ComboBox({ 
  value, 
  placeholder = "Select...", 
  options, 
  onSelect, 
  className,
  searchPlaceholder = "Search..."
}: ComboBoxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [popoverStyle, setPopoverStyle] = useState<{ left: number; top: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Group options
  const groupedOptions = useMemo(() => {
    const filtered = options.filter(option => 
      option.label.toLowerCase().includes(search.toLowerCase())
    )
    
    const groups = new Map<string, ComboBoxOption[]>()
    
    filtered.forEach(option => {
      const groupName = option.group || 'Other'
      if (!groups.has(groupName)) {
        groups.set(groupName, [])
      }
      groups.get(groupName)!.push(option)
    })
    
    return Array.from(groups.entries()).map(([groupName, items]) => ({
      groupName,
      items: items.sort((a, b) => a.label.localeCompare(b.label))
    }))
  }, [options, search])

  const selectedOption = options.find(opt => opt.value === value)

  // Position popover (fixed to viewport) when opened
  useEffect(() => {
    const updatePosition = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const gap = 4 // small spacing between button and popover
      setPopoverStyle({ left: rect.left, top: rect.bottom + gap, width: rect.width })
    }

    if (open) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const inTrigger = containerRef.current?.contains(target)
      const inPopover = popoverRef.current?.contains(target)
      if (!inTrigger && !inPopover) {
        setOpen(false)
        setSearch('')
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Focus search input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {open && popoverStyle && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[1000] max-h-80 overflow-hidden rounded-md bg-popover text-popover-foreground shadow-md"
          style={{ left: popoverStyle.left, top: popoverStyle.top, width: popoverStyle.width }}
        >
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {groupedOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No results found.</div>
            ) : (
              groupedOptions.map(({ groupName, items }) => (
                <div key={groupName}>
                  {groupedOptions.length > 1 && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{groupName}</div>
                  )}
                  {items.map((option) => (
                    <button
                      key={option.value}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        value === option.value && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleSelect(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

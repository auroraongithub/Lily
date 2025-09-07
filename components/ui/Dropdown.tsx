"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"

interface DropdownProps {
  value?: string
  placeholder?: string
  options: Array<{ value: string; label: string }>
  onSelect: (value: string) => void
  className?: string
  disabled?: boolean
}

export function Dropdown({ 
  value, 
  placeholder = "Select...", 
  options, 
  onSelect, 
  className,
  disabled = false 
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full justify-between font-normal min-w-0",
          !selectedOption && "text-muted-foreground"
        )}
      >
        <span className="truncate flex-1 text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn(
          "ml-2 h-4 w-4 shrink-0 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-background p-1 shadow-lg">
          <div className="max-h-60 overflow-auto">
            {options.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No options available
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onSelect(option.value)
                    setIsOpen(false)
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const PopoverContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
} | null>(null)

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Popover({ open: controlledOpen, onOpenChange, children }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const handleOpenChange = onOpenChange || setInternalOpen

  return (
    <PopoverContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({ 
  children, 
  asChild = false,
  ...props 
}: { 
  children: React.ReactNode
  asChild?: boolean
} & React.HTMLAttributes<HTMLElement>) {
  const context = React.useContext(PopoverContext)
  if (!context) throw new Error("PopoverTrigger must be used within Popover")

  const handleClick = () => {
    context.onOpenChange(!context.open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...children.props,
      ...props,
      onClick: handleClick,
    } as any)
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

export function PopoverContent({ 
  children, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(PopoverContext)
  if (!context) throw new Error("PopoverContent must be used within Popover")

  if (!context.open) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => context.onOpenChange(false)}
      />
      <div
        className={cn(
          "absolute z-50 mt-1 rounded-md border bg-background p-4 text-foreground shadow-lg backdrop-blur-sm",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className
        )}
        style={{ backgroundColor: 'hsl(var(--background))', opacity: 1 }}
        {...props}
      >
        {children}
      </div>
    </>
  )
}

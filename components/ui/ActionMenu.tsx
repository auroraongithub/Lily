"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"

interface ActionMenuItem {
  label: string
  onClick: () => void
  icon?: React.ComponentType<{ className?: string }>
  destructive?: boolean
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  className?: string
}

export function ActionMenu({ items, className }: ActionMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="h-8 w-8 p-0"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-background p-1 shadow-lg">
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={index}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  item.destructive && "text-destructive hover:bg-destructive hover:text-destructive-foreground"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  item.onClick()
                  setIsOpen(false)
                }}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

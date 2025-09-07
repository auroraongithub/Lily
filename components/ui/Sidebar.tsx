"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ComponentType } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Menu } from "lucide-react"
import { ProjectNavigation } from "@/features/projects/components/ProjectNavigation"

export type SidebarItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const MOBILE_BREAKPOINT = 768

export function Sidebar({
  items,
  collapsed,
  onToggle,
}: {
  items: SidebarItem[]
  collapsed: boolean
  onToggle: () => void
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (!isMobile) setMobileOpen(false)
  }, [isMobile])

  const widthClass = useMemo(() => {
    if (isMobile) return mobileOpen ? "translate-x-0" : "-translate-x-full"
    return collapsed ? "w-14" : "w-60"
  }, [collapsed, isMobile, mobileOpen])

  return (
    <aside
      className={cn(
        "layout-transition border-r bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40",
        isMobile
          ? cn("fixed left-0 top-0 z-40 h-full w-60 transform transition-transform duration-200 ease-in-out", widthClass)
          : cn("relative h-auto", widthClass)
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className={cn("flex h-12 items-center border-b px-2 justify-start gap-2")}>        
        <Button
          variant="ghost"
          size="icon"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          onClick={() => (isMobile ? setMobileOpen(v => !v) : onToggle())}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <Link
          href="/"
          className={cn(
            "text-sm font-semibold",
            // Hide label when desktop-collapsed to keep sidebar narrow
            collapsed && !isMobile ? "sr-only" : ""
          )}
        >
          Lily
        </Link>
      </div>

      {/* Project Navigation - only show when not collapsed */}
      {!collapsed || isMobile ? (
        <div className="border-b pb-2 mb-2">
          <ProjectNavigation />
        </div>
      ) : null}

      <nav className="flex flex-col gap-1 p-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              collapsed && !isMobile ? "justify-center" : ""
            )}
            title={label}
          >
            <Icon className="h-4 w-4" />
            <span className={cn("truncate", collapsed && !isMobile ? "sr-only" : "")}>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

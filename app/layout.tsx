"use client"

import "./globals.css"
import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/ui/Sidebar"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { Type, Map, Folder, Import, Settings, PanelsTopLeft, Palette } from "lucide-react"
import { ProjectProvider, useProjectContext } from "@/features/projects/context/ProjectContext"
import { ThemeProvider } from "@/features/settings/context/ThemeContext"

// App modes
export type AppMode = "dashboard" | "editor"

const MODE_KEY = "lily:mode"
const SIDEBAR_KEY = "lily:sidebar:collapsed"

function HeaderChapterIndicator() {
  const { currentChapter } = useProjectContext()
  
  if (!currentChapter) return null
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Editing:</span>
      <span className="font-medium">{currentChapter.title}</span>
    </div>
  )
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>("dashboard")
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const isFullBleed = pathname.startsWith("/mindmap") || pathname.startsWith("/editor") || pathname.startsWith("/moodboard")

  // hydrate from localStorage
  useEffect(() => {
    try {
      const m = (localStorage.getItem(MODE_KEY) as AppMode | null) ?? "dashboard"
      const c = localStorage.getItem(SIDEBAR_KEY)
      setMode(m)
      setCollapsed(c === "1")
    } catch {}
  }, [])

  // persist
  useEffect(() => {
    try { localStorage.setItem(MODE_KEY, mode) } catch {}
  }, [mode])
  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0") } catch {}
  }, [collapsed])

  const navItems = useMemo(() => ([
    { href: "/projects", label: "Projects", icon: Folder },
    { href: "/editor", label: "Editor", icon: Type },
    { href: "/mindmap", label: "Mind Map", icon: Map },
    { href: "/moodboard", label: "Moodboard", icon: Palette },
    { href: "/import-export", label: "Import/Export", icon: Import },
    { href: "/settings", label: "Settings", icon: Settings },
  ]), [])

  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className={cn("h-full flex bg-background text-foreground overflow-hidden")}>        
        <ThemeProvider>
          <ProjectProvider>
            {/* Sidebar */}
            <Sidebar
              items={navItems}
              collapsed={mode === "editor" ? true : collapsed}
              onToggle={() => setCollapsed(x => !x)}
            />

            {/* Main content area */}
            <div className={cn(
              "flex-1 flex flex-col min-w-0 min-h-0 layout-transition",
            )}>
              {/* Top bar */}
              <header className="z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-12 items-center gap-2 px-3">
                  <HeaderChapterIndicator />
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="gap-2"
                      aria-label="Toggle layout mode"
                      onClick={() => setMode(m => (m === "dashboard" ? "editor" : "dashboard"))}
                    >
                      <PanelsTopLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">{mode === "dashboard" ? "Centered Editor" : "Dashboard"} Mode</span>
                    </Button>
                  </div>
                </div>
              </header>

              <main
                className={cn(
                  "flex-1 min-h-0 overflow-hidden",
                  isFullBleed ? "p-0" : "px-4 pt-6 pb-4",
                  // Centered content only when explicitly in Centered Editor Mode and not a full-bleed page
                  mode === "editor" && !isFullBleed ? "w-full max-w-3xl mx-auto" : "",
                )}
              >
                {children}
              </main>
            </div>
          </ProjectProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

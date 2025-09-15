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
import { KeyboardShortcutsProvider } from "@/features/settings/context/KeyboardShortcutsContext"
import { ComboBox } from "@/components/ui/ComboBox"
import { useVolumes, useChapters } from "@/features/projects/hooks/useVolumesAndChapters"
import { ChevronLeft, ChevronRight } from "lucide-react"

// App modes
export type AppMode = "dashboard" | "editor"

const MODE_KEY = "lily:mode"
const SIDEBAR_KEY = "lily:sidebar:collapsed"

function HeaderChapterIndicator() {
  const { currentProject, currentVolume, currentChapter, setCurrentChapter, setCurrentVolume } = useProjectContext()
  const { volumes } = useVolumes(currentProject?.id || "")
  const { chapters } = useChapters(currentProject?.id || "")

  const allChapters = useMemo(() => {
    if (!chapters) return []
    return chapters.slice().sort((a, b) => a.index - b.index)
  }, [chapters])

  // Chapters in the same scope as the current chapter (same volume or standalone)
  const scopeChapters = useMemo(() => {
    if (!allChapters.length) return [] as typeof allChapters
    const inVolume = currentChapter?.volumeId
    const list = inVolume
      ? allChapters.filter(ch => ch.volumeId === inVolume)
      : allChapters.filter(ch => !ch.volumeId)
    return list
  }, [allChapters, currentChapter?.volumeId])

  const chapterOptions = useMemo(() => {
    if (!allChapters.length) return []
    
    const options: Array<{ value: string; label: string; group: string }> = []
    
    // Standalone chapters (no volume)
    const standalone = allChapters.filter(ch => !ch.volumeId)
    if (standalone.length > 0) {
      standalone.forEach(ch => {
        options.push({
          value: ch.id,
          label: `Chapter ${ch.index}: ${ch.title}`,
          group: 'Standalone Chapters'
        })
      })
    }
    
    // Chapters grouped by volume
    volumes?.forEach(volume => {
      const volumeChapters = allChapters.filter(ch => ch.volumeId === volume.id)
      if (volumeChapters.length > 0) {
        volumeChapters.forEach(ch => {
          options.push({
            value: ch.id,
            label: `Chapter ${ch.index}: ${ch.title}`,
            group: volume.title
          })
        })
      }
    })
    
    return options
  }, [allChapters, volumes])

  const handleChapterChange = (chapterId: string) => {
    const ch = allChapters.find(c => c.id === chapterId)
    if (ch) {
      setCurrentChapter(ch)
      // Also set the volume if the chapter belongs to one
      if (ch.volumeId && volumes) {
        const volume = volumes.find(v => v.id === ch.volumeId)
        if (volume) setCurrentVolume(volume)
      } else {
        setCurrentVolume(null)
      }
    }
  }

  const handlePrevChapter = () => {
    if (!currentChapter || !scopeChapters?.length) return
    const currentIndex = scopeChapters.findIndex(ch => ch.id === currentChapter.id)
    if (currentIndex > 0) {
      const prevChapter = scopeChapters[currentIndex - 1]
      if (prevChapter) {
        handleChapterChange(prevChapter.id)
      }
    }
  }

  const handleNextChapter = () => {
    if (!currentChapter || !scopeChapters?.length) return
    const currentIndex = scopeChapters.findIndex(ch => ch.id === currentChapter.id)
    if (currentIndex >= 0 && currentIndex < scopeChapters.length - 1) {
      const nextChapter = scopeChapters[currentIndex + 1]
      if (nextChapter) {
        handleChapterChange(nextChapter.id)
      }
    }
  }

  const currentIndex = currentChapter ? scopeChapters.findIndex(ch => ch.id === currentChapter.id) : -1
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < scopeChapters.length - 1

  // Hide controls when no project is selected, but only after hooks/memos
  if (!currentProject) return null

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevChapter}
        disabled={!hasPrev}
        className="h-8 w-8"
        title="Previous chapter"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <ComboBox
        value={currentChapter?.id}
        placeholder="Select chapter..."
        options={chapterOptions}
        onSelect={handleChapterChange}
        className="min-w-[250px]"
        searchPlaceholder="Search chapters..."
      />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextChapter}
        disabled={!hasNext}
        className="h-8 w-8"
        title="Next chapter"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>("dashboard")
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  // Full-bleed pages should remain edge-to-edge (no rounded container)
  const isFullBleed = pathname.startsWith("/mindmap") || pathname.startsWith("/moodboard")

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
          <KeyboardShortcutsProvider>
            <ProjectProvider>
              {/* Sidebar */}
              <Sidebar
                items={navItems}
                collapsed={collapsed}
                onToggle={() => setCollapsed(x => !x)}
              />

              {/* Main content area */}
              <div className={cn(
                "flex-1 flex flex-col min-w-0 min-h-0 layout-transition",
                !isFullBleed && "rounded-l-[var(--radius)] overflow-hidden",
              )}>
                {/* Top bar */}
                <header className={cn(
                  "z-30 w-full bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40",
                  !isFullBleed && "rounded-tl-[var(--radius)] overflow-hidden"
                )}>
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
          </KeyboardShortcutsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

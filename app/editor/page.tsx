"use client"

import { useEffect, useRef, useState } from 'react'
import { LexicalEditor } from '@/features/editor/LexicalEditor'
import { useProjectContext } from '@/features/projects/context/ProjectContext'
import { useChapterEditor } from '@/features/projects/hooks/useChapterEditor'
import { useProjectData } from '@/features/projects/hooks/useProjectData'
import { EditorLockout } from '@/components/ui/EditorLockout'
import { db } from '@/lib/db'
import type { EditorDocument } from '@/features/editor/types'
import type { Project, Chapter } from '@/lib/types'
import { MindMapWorkspace } from '@/features/mindmap/components/MindMapWorkspace'
import { MoodboardGrid } from '@/features/moodboard'
import ImportExportPage from '@/app/import-export/page'
import ProjectsPage from '@/app/projects/page'
import SettingsPage from '@/app/settings/page'
import { OutlinePane } from '@/features/planning/components/OutlinePane'
import { Button } from '@/components/ui/Button'
import { Columns2, Link2 } from 'lucide-react'

export default function EditorPage() {
  const { 
    currentProject, 
    currentVolume, 
    currentChapter,
    setCurrentProject,
    setCurrentVolume,
    setCurrentChapter
  } = useProjectContext()
  
  const { document: chapterDocument, isLoading: chapterLoading, updateDocument: updateChapterDocument } = useChapterEditor(currentChapter)
  const { volumes, chapters, getVolumeChapters, createVolume, createChapter, reorderVolumes, reorderChapters, moveChapter } = useProjectData(currentProject?.id || null)
  const [fallbackDocument, setFallbackDocument] = useState<EditorDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])

  // Split view state
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [syncScroll, setSyncScroll] = useState(true)

  // Split view sizing
  const [splitRatio, setSplitRatio] = useState(0.5) // 0..1 width for left pane
  const splitContainerRef = useRef<HTMLDivElement | null>(null)
  const onSplitDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const container = splitContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const startX = e.clientX
    const startRatio = splitRatio
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const next = Math.max(0.2, Math.min(0.8, startRatio + dx / Math.max(1, rect.width)))
      setSplitRatio(next)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  type PaneType = 'editor' | 'mindmap' | 'outline' | 'moodboard' | 'importExport' | 'projects' | 'settings'
  const [paneBType, setPaneBType] = useState<PaneType>('mindmap')
  const [selectedVolumeB, setSelectedVolumeB] = useState<typeof currentVolume>(null)
  const [selectedChapterB, setSelectedChapterB] = useState<Chapter | null>(null)

  // Secondary editor states (fallback when no chapter B selected)
  const [fallbackDocumentB, setFallbackDocumentB] = useState<EditorDocument | null>(null)
  const [isLoadingB, setIsLoadingB] = useState(false)

  // Scroll syncing refs
  const scrollRefA = useRef<HTMLDivElement | null>(null)
  const scrollRefB = useRef<HTMLDivElement | null>(null)
  const isSyncingRef = useRef(false)

  // Load available projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const allProjects = await db.projects.orderBy('updatedAt').reverse().toArray()
        setProjects(allProjects)
      } catch (error) {
        console.error('Failed to load projects:', error)
      }
    }
    loadProjects()
  }, [])

  // Load fallback document for secondary editor when needed
  useEffect(() => {
    const loadFallbackB = async () => {
      if (paneBType !== 'editor' || selectedChapterB) {
        setFallbackDocumentB(null)
        return
      }
      try {
        setIsLoadingB(true)
        let doc = await db.documents.get('default-document-b')
        if (!doc) {
          const newDoc: EditorDocument = {
            id: 'default-document-b',
            title: 'Secondary Document',
            content: '',
            wordCount: 0,
            characterCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            fontPreset: 'serif',
          }
          await db.documents.add(newDoc)
          doc = newDoc
        }
        setFallbackDocumentB(doc)
      } catch (e) {
        console.error('Failed to load secondary fallback document:', e)
        setFallbackDocumentB({
          id: 'fallback-document-b',
          title: 'Secondary Document',
          content: '',
          wordCount: 0,
          characterCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          fontPreset: 'serif',
        })
      } finally {
        setIsLoadingB(false)
      }
    }
    loadFallbackB()
  }, [paneBType, selectedChapterB])

  // Load fallback document when no chapter is selected
  useEffect(() => {
    const loadFallbackDocument = async () => {
      if (currentChapter) {
        setFallbackDocument(null)
        return
      }

      try {
        let doc = await db.documents.get('default-document')
        
        if (!doc) {
          const newDoc: EditorDocument = {
            id: 'default-document',
            title: 'Untitled Document',
            content: '',
            wordCount: 0,
            characterCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            fontPreset: 'serif',
          }
          
          await db.documents.add(newDoc)
          doc = newDoc
        }
        
        setFallbackDocument(doc)
      } catch (error) {
        console.error('Failed to load fallback document:', error)
        
        setFallbackDocument({
          id: 'fallback-document',
          title: 'Untitled Document',
          content: '',
          wordCount: 0,
          characterCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          fontPreset: 'serif',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (!currentChapter) {
      loadFallbackDocument()
    } else {
      setIsLoading(false)
    }
  }, [currentChapter])

  const handleFallbackDocumentChange = async (changes: Partial<EditorDocument>) => {
    if (!fallbackDocument) return

    const updatedDocument = { ...fallbackDocument, ...changes }
    setFallbackDocument(updatedDocument)

    if (fallbackDocument.id !== 'fallback-document') {
      try {
        await db.documents.update(fallbackDocument.id, changes)
      } catch (error) {
        console.error('Failed to update fallback document:', error)
      }
    }
  }

  const handleFallbackDocumentChangeB = async (changes: Partial<EditorDocument>) => {
    if (!fallbackDocumentB) return

    const updatedDocument = { ...fallbackDocumentB, ...changes }
    setFallbackDocumentB(updatedDocument)

    if (fallbackDocumentB.id !== 'fallback-document-b') {
      try {
        await db.documents.update(fallbackDocumentB.id, changes)
      } catch (error) {
        console.error('Failed to update secondary fallback document:', error)
      }
    }
  }

  // Determine lockout state based on hierarchical checking
  const getLockoutState = () => {
    if (!currentProject) return 'no-project'
    if (!currentVolume) return 'no-volume'
    if (!currentChapter) return 'no-chapter'
    return null
  }

  const lockoutType = getLockoutState()
  const isLocked = lockoutType !== null

  // Right pane lockout mirrors project/volume/chapter selection for pane B
  const getLockoutStateB = () => {
    if (!currentProject) return 'no-project' as const
    if (!selectedVolumeB) return 'no-volume' as const
    if (!selectedChapterB) return 'no-chapter' as const
    return null
  }
  const lockoutTypeB = getLockoutStateB()
  const isLockedB = lockoutTypeB !== null

  // Handle create/select actions
  const handleCreateProject = async () => {
    // Navigate to projects page to create new project
    window.location.href = '/projects'
  }

  const handleCreateVolume = async () => {
    if (!currentProject) return
    try {
      const newVolume = await createVolume(`Volume ${volumes.length + 1}`)
      setCurrentVolume(newVolume)
    } catch (error) {
      console.error('Failed to create volume:', error)
    }
  }

  const handleCreateChapter = async () => {
    if (!currentProject) return
    try {
      const volumeChapters = currentVolume ? getVolumeChapters(currentVolume.id) : chapters.filter(c => !c.volumeId)
      const newChapter = await createChapter(`Chapter ${volumeChapters.length + 1}`, currentVolume?.id)
      setCurrentChapter(newChapter)
    } catch (error) {
      console.error('Failed to create chapter:', error)
    }
  }

  // Right pane: create actions
  const handleCreateVolumeB = async () => {
    if (!currentProject) return
    try {
      const newVolume = await createVolume(`Volume ${volumes.length + 1}`)
      setSelectedVolumeB(newVolume)
      setSelectedChapterB(null)
    } catch (error) {
      console.error('Failed to create volume (right pane):', error)
    }
  }

  const handleCreateChapterB = async () => {
    if (!currentProject || !selectedVolumeB) return
    try {
      const volumeChapters = getVolumeChapters(selectedVolumeB.id)
      const newChapter = await createChapter(`Chapter ${volumeChapters.length + 1}`, selectedVolumeB.id)
      setSelectedChapterB(newChapter)
    } catch (error) {
      console.error('Failed to create chapter (right pane):', error)
    }
  }

  const handleSelectVolume = async (volumeId: string) => {
    const volume = volumes.find(v => v.id === volumeId)
    if (volume) {
      setCurrentVolume(volume)
      setCurrentChapter(null) // Clear chapter when switching volumes
    }
  }

  const handleSelectChapter = async (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId)
    if (chapter) {
      setCurrentChapter(chapter)
    }
  }

  const handleSelectVolumeB = async (volumeId: string) => {
    const volume = volumes.find(v => v.id === volumeId) || null
    setSelectedVolumeB(volume)
    setSelectedChapterB(null) // Clear chapter when switching volumes
  }

  const handleSelectChapterB = async (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId) || null
    setSelectedChapterB(chapter)
  }

  const handleDocumentChange = currentChapter ? updateChapterDocument : handleFallbackDocumentChange
  const document = currentChapter ? chapterDocument : fallbackDocument
  const loading = currentChapter ? chapterLoading : isLoading

  // Secondary pane document hooks
  const { document: docB, isLoading: loadingBHook, updateDocument: updateDocB } = useChapterEditor(selectedChapterB)
  const documentB = selectedChapterB ? docB : fallbackDocumentB
  const loadingBFinal = selectedChapterB ? loadingBHook : isLoadingB

  // Scroll sync handlers
  const syncScrollHandler = (source: 'A' | 'B') => {
    return () => {
      if (!syncScroll) return
      if (isSyncingRef.current) return
      const src = source === 'A' ? scrollRefA.current : scrollRefB.current
      const dst = source === 'A' ? scrollRefB.current : scrollRefA.current
      if (!src || !dst) return
      isSyncingRef.current = true
      const ratio = src.scrollTop / Math.max(1, src.scrollHeight - src.clientHeight)
      dst.scrollTop = ratio * (dst.scrollHeight - dst.clientHeight)
      // Use a microtask to release the lock
      Promise.resolve().then(() => { isSyncingRef.current = false })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">
          {currentChapter ? `Loading ${currentChapter.title}...` : 'Loading editor...'}
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Failed to load editor. Please refresh the page.</div>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Split view controls - clean switches */}
      <div className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40 rounded-tl-[var(--radius)] rounded-tr-[var(--radius)] overflow-hidden px-6 py-4 flex items-center gap-6 flex-nowrap overflow-x-auto">
        {/* Split View Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSplitEnabled((v) => !v)}
            className={`
              relative inline-flex items-center justify-center w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              ${splitEnabled ? 'bg-primary' : 'bg-muted'}
            `}
            title="Toggle split view"
            aria-pressed={splitEnabled}
          >
            <span
              className={`
                inline-block w-4 h-4 bg-background rounded-full shadow-sm transition-transform duration-200
                ${splitEnabled ? 'translate-x-2' : '-translate-x-2'}
              `}
            />
          </button>
          <div className="flex items-center gap-2">
            <Columns2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Split view</span>
          </div>
        </div>

        {/* Sync Scroll Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSyncScroll((v) => !v)}
            disabled={!splitEnabled}
            className={`
              relative inline-flex items-center justify-center w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
              ${syncScroll && splitEnabled ? 'bg-primary' : 'bg-muted'}
            `}
            title="Sync scroll between editors"
            aria-pressed={syncScroll}
          >
            <span
              className={`
                inline-block w-4 h-4 bg-background rounded-full shadow-sm transition-transform duration-200
                ${syncScroll && splitEnabled ? 'translate-x-2' : '-translate-x-2'}
              `}
            />
          </button>
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Sync scroll</span>
          </div>
        </div>

        {/* Right Pane Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-medium text-muted-foreground">Right pane:</span>
          <select
            className="h-8 px-3 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            value={paneBType}
            onChange={(e) => setPaneBType(e.target.value as PaneType)}
            disabled={!splitEnabled}
          >
            <option value="editor">Editor</option>
            <option value="mindmap">Mind Map</option>
            <option value="outline">Outline</option>
            <option value="moodboard">Moodboard</option>
            <option value="importExport">Import/Export</option>
            <option value="projects">Projects</option>
            <option value="settings">Settings</option>
          </select>
          {paneBType === 'editor' && (
            <>
              <select
                className="h-8 px-3 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[120px] disabled:opacity-50"
                value={selectedVolumeB?.id || ''}
                onChange={(e) => handleSelectVolumeB(e.target.value)}
                disabled={!splitEnabled}
              >
                {/* hidden placeholder to keep controlled value when none selected */}
                <option value="" disabled hidden></option>
                {volumes.map((v) => (
                  <option key={v.id} value={v.id}>{v.title}</option>
                ))}
              </select>
              <select
                className="h-8 px-3 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[140px] disabled:opacity-50"
                value={selectedChapterB?.id || ''}
                onChange={(e) => handleSelectChapterB(e.target.value)}
                disabled={!splitEnabled || !selectedVolumeB}
              >
                {/* hidden placeholder to keep controlled value when none selected */}
                <option value="" disabled hidden></option>
                {(selectedVolumeB ? getVolumeChapters(selectedVolumeB.id) : []).map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="relative flex-1 min-h-0 h-full">
        {!splitEnabled && (
          <LexicalEditor
            document={document}
            onDocumentChange={handleDocumentChange}
            className="flex-1 min-h-0 h-full"
            isLocked={isLocked}
            scrollRef={scrollRefA}
            onScroll={syncScrollHandler('A')}
            showStats={true}
          />
        )}

        {splitEnabled && (
          <div ref={splitContainerRef} className="flex flex-1 min-h-0 h-full min-w-0 flex-row">
            {/* Left pane: primary editor */}
            <div className="min-h-0 min-w-0 h-full flex flex-col flex-none" style={{ width: `${splitRatio * 100}%` }}>
              <LexicalEditor
                document={document}
                onDocumentChange={handleDocumentChange}
                className="flex-1 min-h-0 h-full"
                isLocked={isLocked}
                scrollRef={scrollRefA}
                onScroll={syncScrollHandler('A')}
                showStats={true}
                alwaysShowScrollbar
              />
            </div>
            {/* Resizer */}
            <div
              role="separator"
              aria-orientation="vertical"
              title="Drag to resize"
              onMouseDown={onSplitDragStart}
              onDoubleClick={() => setSplitRatio(0.5)}
              className="relative w-2 h-full cursor-col-resize group select-none"
            >
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border/30 group-hover:bg-border/50" />
            </div>
            {/* Right pane: selectable */}
            <div className="min-h-0 min-w-0 h-full flex flex-col flex-1">            
              {paneBType === 'editor' ? (
                loadingBFinal || !documentB ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading…</div>
                ) : (
                  <div className="relative flex-1 min-h-0 h-full">
                    <LexicalEditor
                      document={documentB}
                      onDocumentChange={selectedChapterB ? updateDocB : handleFallbackDocumentChangeB}
                      className="flex-1 min-h-0 h-full"
                      isLocked={isLockedB}
                      scrollRef={scrollRefB}
                      onScroll={syncScrollHandler('B')}
                      showStats={false}
                      alwaysShowScrollbar
                    />
                    {isLockedB && (
                      <EditorLockout
                        lockoutType={lockoutTypeB as any}
                        projectName={currentProject?.name}
                        volumeName={selectedVolumeB?.title}
                        volumes={volumes}
                        chapters={selectedVolumeB ? getVolumeChapters(selectedVolumeB.id) : []}
                        onCreateProject={handleCreateProject}
                        onCreateVolume={handleCreateVolumeB}
                        onCreateChapter={handleCreateChapterB}
                        onSelectVolume={handleSelectVolumeB}
                        onSelectChapter={handleSelectChapterB}
                      />
                    )}
                  </div>
                )
              ) : paneBType === 'mindmap' ? (
                <div className="flex-1 min-h-0 h-full overflow-hidden">
                  {currentProject ? (
                    <MindMapWorkspace projectId={currentProject.id} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">Select a project to view Mind Map</div>
                  )}
                </div>
              ) : paneBType === 'moodboard' ? (
                <div className="flex-1 min-h-0 h-full overflow-hidden">
                  {currentProject ? (
                    <MoodboardGrid />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">Select a project to view Moodboard</div>
                  )}
                </div>
              ) : paneBType === 'importExport' ? (
                <div className="flex-1 min-h-0 h-full overflow-hidden">
                  <ImportExportPage />
                </div>
              ) : paneBType === 'projects' ? (
                <div className="flex-1 min-h-0 h-full overflow-hidden">
                  <ProjectsPage />
                </div>
              ) : paneBType === 'settings' ? (
                <div className="flex-1 min-h-0 h-full overflow-hidden">
                  <SettingsPage />
                </div>
              ) : (
                <div className="flex-1 min-h-0 h-full overflow-hidden">
                  {currentProject ? (
                    <OutlinePane
                      projectId={currentProject.id}
                      volumes={volumes}
                      chapters={chapters}
                      getVolumeChapters={getVolumeChapters}
                      reorderVolumes={reorderVolumes}
                      reorderChapters={reorderChapters}
                      moveChapter={moveChapter}
                      onSelectVolume={handleSelectVolume}
                      onSelectChapter={handleSelectChapter}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">Select a project to view Outline</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lockout Overlay - limited to content area */}
        {isLocked && (
          <EditorLockout
            lockoutType={lockoutType}
            projectName={currentProject?.name}
            volumeName={currentVolume?.title}
            volumes={volumes}
            chapters={currentVolume ? getVolumeChapters(currentVolume.id) : chapters.filter(c => !c.volumeId)}
            onCreateProject={handleCreateProject}
            onCreateVolume={handleCreateVolume}
            onCreateChapter={handleCreateChapter}
            onSelectVolume={handleSelectVolume}
            onSelectChapter={handleSelectChapter}
          />
        )}
      </div>
    </div>
  )
}

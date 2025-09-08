"use client"

import { useEffect, useState } from 'react'
import { LexicalEditor } from '@/features/editor/LexicalEditor'
import { useProjectContext } from '@/features/projects/context/ProjectContext'
import { useChapterEditor } from '@/features/projects/hooks/useChapterEditor'
import { useProjectData } from '@/features/projects/hooks/useProjectData'
import { EditorLockout } from '@/components/ui/EditorLockout'
import { db } from '@/lib/db'
import type { EditorDocument } from '@/features/editor/types'
import type { Project } from '@/lib/types'

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
  const { volumes, chapters, getVolumeChapters, createVolume, createChapter } = useProjectData(currentProject?.id || null)
  const [fallbackDocument, setFallbackDocument] = useState<EditorDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])

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

  // Determine lockout state based on hierarchical checking
  const getLockoutState = () => {
    if (!currentProject) return 'no-project'
    if (!currentVolume) return 'no-volume'
    if (!currentChapter) return 'no-chapter'
    return null
  }

  const lockoutType = getLockoutState()
  const isLocked = lockoutType !== null

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

  const handleDocumentChange = currentChapter ? updateChapterDocument : handleFallbackDocumentChange
  const document = currentChapter ? chapterDocument : fallbackDocument
  const loading = currentChapter ? chapterLoading : isLoading

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
    <div className="h-full flex flex-col relative">
      <LexicalEditor 
        document={document}
        onDocumentChange={handleDocumentChange}
        className="flex-1"
        isLocked={isLocked}
      />
      
      {/* Lockout Overlay */}
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
  )
}

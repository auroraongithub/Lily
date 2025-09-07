"use client"

import { useEffect, useState } from 'react'
import { LexicalEditor } from '@/features/editor/LexicalEditor'
import { useProjectContext } from '@/features/projects/context/ProjectContext'
import { useChapterEditor } from '@/features/projects/hooks/useChapterEditor'
import { db } from '@/lib/db'
import type { EditorDocument } from '@/features/editor/types'

export default function EditorPage() {
  const { currentChapter } = useProjectContext()
  const { document: chapterDocument, isLoading: chapterLoading, updateDocument: updateChapterDocument } = useChapterEditor(currentChapter)
  const [fallbackDocument, setFallbackDocument] = useState<EditorDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
    <div className="h-full flex flex-col">
      <LexicalEditor 
        document={document}
        onDocumentChange={handleDocumentChange}
        className="flex-1"
      />
    </div>
  )
}

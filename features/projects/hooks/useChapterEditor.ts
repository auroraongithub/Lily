import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import type { Chapter } from '@/lib/types'
import type { EditorDocument } from '@/features/editor/types'

export function useChapterEditor(chapter: Chapter | null) {
  const [document, setDocument] = useState<EditorDocument | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadChapterDocument = async () => {
      if (!chapter) {
        setDocument(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        let doc: EditorDocument | undefined

        if (chapter.documentId) {
          // Try to load existing document
          doc = await db.documents.get(chapter.documentId)
        }

        if (!doc) {
          // Create a new document for this chapter
          const documentId = `chapter-${chapter.id}`
          const newDoc: EditorDocument = {
            id: documentId,
            title: chapter.title,
            content: '',
            wordCount: 0,
            characterCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            fontPreset: 'serif',
          }

          await db.transaction('rw', [db.documents, db.chapters], async () => {
            await db.documents.add(newDoc)
            await db.chapters.update(chapter.id, { documentId })
          })

          doc = newDoc
        }

        setDocument(doc)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapter document')
        
        // Fallback to in-memory document
        setDocument({
          id: `fallback-${chapter.id}`,
          title: chapter.title,
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

    loadChapterDocument()
  }, [chapter])

  const updateDocument = async (changes: Partial<EditorDocument>) => {
    if (!document) return

    const updatedDocument = { ...document, ...changes, updatedAt: new Date() }
    setDocument(updatedDocument)

    // Update database if document exists in DB
    if (!document.id.startsWith('fallback-')) {
      try {
        await db.documents.update(document.id, { ...changes, updatedAt: new Date() })
        
        // Update chapter word count if it changed
        if (changes.wordCount !== undefined && chapter) {
          await db.chapters.update(chapter.id, { 
            wordCount: changes.wordCount,
            updatedAt: new Date().toISOString()
          })
        }
      } catch (error) {
        console.error('Failed to update document:', error)
      }
    }
  }

  return {
    document,
    isLoading,
    error,
    updateDocument,
  }
}

export function useChapterNavigation() {
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null)

  const startAutoSave = (saveFunction: () => void, intervalMs: number = 2000) => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval)
    }
    
    const interval = setInterval(saveFunction, intervalMs)
    setAutoSaveInterval(interval)
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }

  const stopAutoSave = () => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval)
      setAutoSaveInterval(null)
    }
  }

  return {
    startAutoSave,
    stopAutoSave,
  }
}

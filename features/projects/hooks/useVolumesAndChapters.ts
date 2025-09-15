import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import type { Volume, Chapter } from '@/lib/types'

// Global event emitters for volume and chapter updates
const volumeEventTarget = new EventTarget()
const chapterEventTarget = new EventTarget()

export const triggerVolumesRefresh = () => {
  volumeEventTarget.dispatchEvent(new Event('volumesChanged'))
}

export const triggerChaptersRefresh = () => {
  chapterEventTarget.dispatchEvent(new Event('chaptersChanged'))
}

export function useVolumes(projectId: string) {
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadVolumes = async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      const projectVolumes = await db.volumes.where('projectId').equals(projectId).sortBy('index')
      setVolumes(projectVolumes)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load volumes')
    } finally {
      setLoading(false)
    }
  }

  const createVolume = async (title: string) => {
    if (!projectId) throw new Error('Project ID is required to create a volume')
    
    try {
      const existingVolumes = await db.volumes.where('projectId').equals(projectId).toArray()
      const maxIndex = Math.max(0, ...existingVolumes.map(v => v.index))
      
      const now = new Date().toISOString()
      const volume: Volume = {
        id: crypto.randomUUID(),
        projectId,
        title,
        index: maxIndex + 1,
        createdAt: now,
        updatedAt: now,
      }
      await db.volumes.add(volume)
      await loadVolumes()
      triggerVolumesRefresh()
      return volume
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create volume')
      throw err
    }
  }

  const updateVolume = async (id: string, updates: Partial<Pick<Volume, 'title'>>) => {
    try {
      const updatedAt = new Date().toISOString()
      await db.volumes.update(id, { ...updates, updatedAt })
      await loadVolumes()
      triggerVolumesRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update volume')
      throw err
    }
  }

  const deleteVolume = async (id: string) => {
    try {
      await db.transaction('rw', [db.volumes, db.chapters, db.documents], async () => {
        // Get chapters to find associated documents
        const chapters = await db.chapters.where('volumeId').equals(id).toArray()
        const documentIds = chapters
          .map(c => c.documentId)
          .filter((id): id is string => id !== undefined)
        
        // Delete documents
        if (documentIds.length > 0) {
          await db.documents.bulkDelete(documentIds)
        }
        
        // Delete chapters
        await db.chapters.where('volumeId').equals(id).delete()
        
        // Delete volume
        await db.volumes.delete(id)
      })
      await loadVolumes()
      triggerVolumesRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete volume')
      throw err
    }
  }

  const reorderVolumes = async (orderedIds: string[]) => {
    if (!projectId) return
    const now = new Date().toISOString()
    await db.transaction('rw', db.volumes, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i]!
        await db.volumes.update(id, { index: i + 1, updatedAt: now })
      }
    })
    await loadVolumes()
    triggerVolumesRefresh()
  }

  useEffect(() => {
    if (projectId) {
      loadVolumes()
    }
    
    // Listen for global volume updates
    const handleVolumesChanged = () => {
      if (projectId) {
        loadVolumes()
      }
    }
    
    volumeEventTarget.addEventListener('volumesChanged', handleVolumesChanged)
    
    return () => {
      volumeEventTarget.removeEventListener('volumesChanged', handleVolumesChanged)
    }
  }, [projectId])

  return {
    volumes,
    loading,
    error,
    createVolume,
    updateVolume,
    deleteVolume,
    reorderVolumes,
    refresh: loadVolumes,
  }
}

export function useChapters(projectId: string, volumeId?: string) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadChapters = async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      let allChapters: Chapter[]
      
      if (volumeId) {
        allChapters = await db.chapters.where('volumeId').equals(volumeId).sortBy('index')
      } else {
        allChapters = await db.chapters.where('projectId').equals(projectId).sortBy('index')
      }
      
      setChapters(allChapters)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chapters')
    } finally {
      setLoading(false)
    }
  }

  const createChapter = async (title: string, volumeId?: string) => {
    if (!projectId) throw new Error('Project ID is required to create a chapter')
    
    try {
      const existingChapters = volumeId 
        ? await db.chapters.where('volumeId').equals(volumeId).toArray()
        : await db.chapters.where('projectId').equals(projectId).toArray()
      const maxIndex = Math.max(0, ...existingChapters.map(c => c.index))
      
      const now = new Date().toISOString()
      const chapterId = crypto.randomUUID()
      const documentId = `chapter-${chapterId}`
      
      // Create the document first
      const document = {
        id: documentId,
        title: title,
        content: '',
        wordCount: 0,
        characterCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        fontPreset: 'serif',
      }
      
      // Create chapter with document reference
      const chapter: Chapter = {
        id: chapterId,
        projectId,
        volumeId,
        title,
        index: maxIndex + 1,
        documentId,
        createdAt: now,
        updatedAt: now,
      }
      
      // Add both in a transaction
      await db.transaction('rw', [db.chapters, db.documents], async () => {
        await db.documents.add(document)
        await db.chapters.add(chapter)
      })
      
      await loadChapters()
      triggerChaptersRefresh()
      return chapter
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chapter')
      throw err
    }
  }

  const updateChapter = async (id: string, updates: Partial<Pick<Chapter, 'title' | 'wordCount'>>) => {
    try {
      const updatedAt = new Date().toISOString()
      await db.chapters.update(id, { ...updates, updatedAt })
      await loadChapters()
      triggerChaptersRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chapter')
      throw err
    }
  }

  const deleteChapter = async (id: string) => {
    try {
      await db.transaction('rw', [db.chapters, db.documents], async () => {
        // Get chapter to find associated document
        const chapter = await db.chapters.get(id)
        if (chapter?.documentId) {
          await db.documents.delete(chapter.documentId)
        }
        await db.chapters.delete(id)
      })
      await loadChapters()
      triggerChaptersRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chapter')
      throw err
    }
  }

  const reorderChapters = async (scopeVolumeId: string | null | undefined, orderedIds: string[]) => {
    if (!projectId) return
    const now = new Date().toISOString()
    await db.transaction('rw', db.chapters, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i]!
        await db.chapters.update(id, { index: i + 1, volumeId: scopeVolumeId ?? undefined, updatedAt: now })
      }
    })
    await loadChapters()
    triggerChaptersRefresh()
  }

  useEffect(() => {
    if (projectId) {
      loadChapters()
    }
    
    // Listen for global chapter updates
    const handleChaptersChanged = () => {
      if (projectId) {
        loadChapters()
      }
    }
    
    chapterEventTarget.addEventListener('chaptersChanged', handleChaptersChanged)
    
    return () => {
      chapterEventTarget.removeEventListener('chaptersChanged', handleChaptersChanged)
    }
  }, [projectId, volumeId])

  return {
    chapters,
    loading,
    error,
    createChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,
    refresh: loadChapters,
  }
}



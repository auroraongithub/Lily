"use client"

import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import type { Project, Volume, Chapter } from '@/lib/types'

export function useProjectData(projectId: string | null) {
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) {
      setVolumes([])
      setChapters([])
      return
    }

    const fetchProjectData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch volumes for the project
        const projectVolumes = await db.volumes
          .where('projectId')
          .equals(projectId)
          .toArray()
        
        // Sort volumes by index
        projectVolumes.sort((a, b) => a.index - b.index)
        setVolumes(projectVolumes)

        // Fetch chapters for the project
        const projectChapters = await db.chapters
          .where('projectId')
          .equals(projectId)
          .toArray()
        
        // Sort chapters by index
        projectChapters.sort((a, b) => a.index - b.index)
        
        setChapters(projectChapters)
      } catch (err) {
        console.error('Failed to fetch project data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch project data')
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [projectId])

  const getVolumeChapters = (volumeId: string) => {
    return chapters.filter(chapter => chapter.volumeId === volumeId)
  }

  const createVolume = async (title: string, index?: number) => {
    if (!projectId) throw new Error('No project selected')
    
    const maxIndex = volumes.length > 0 ? Math.max(...volumes.map(v => v.index)) : 0
    const newVolume: Volume = {
      id: crypto.randomUUID(),
      projectId,
      title,
      index: index ?? maxIndex + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.volumes.add(newVolume)
    setVolumes(prev => [...prev, newVolume].sort((a, b) => a.index - b.index))
    return newVolume
  }

  const createChapter = async (title: string, volumeId?: string, index?: number) => {
    if (!projectId) throw new Error('No project selected')
    
    const relevantChapters = volumeId 
      ? chapters.filter(c => c.volumeId === volumeId)
      : chapters.filter(c => !c.volumeId) // Chapters without volume
    
    const maxIndex = relevantChapters.length > 0 ? Math.max(...relevantChapters.map(c => c.index)) : 0
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      projectId,
      volumeId,
      title,
      index: index ?? maxIndex + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.chapters.add(newChapter)
    setChapters(prev => [...prev, newChapter].sort((a, b) => a.index - b.index))
    return newChapter
  }

  // Reorder volumes based on provided id order
  const reorderVolumes = async (orderedIds: string[]) => {
    if (!projectId) return
    const now = new Date().toISOString()
    await db.transaction('rw', db.volumes, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i]
        await db.volumes.update(id, { index: i + 1, updatedAt: now })
      }
    })
    // Update local state
    setVolumes((prev) => {
      const byId = new Map(prev.map((v) => [v.id, v]))
      const next = orderedIds
        .map((id, idx) => ({ ...byId.get(id)!, index: idx + 1, updatedAt: now }))
        .filter(Boolean) as typeof prev
      return next
    })
  }

  // Reorder chapters within a given volume (or root when volumeId is undefined/null)
  const reorderChapters = async (volumeId: string | null | undefined, orderedIds: string[]) => {
    if (!projectId) return
    const now = new Date().toISOString()
    await db.transaction('rw', db.chapters, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i]
        await db.chapters.update(id, { index: i + 1, volumeId: volumeId ?? undefined, updatedAt: now })
      }
    })
    // Update local state
    setChapters((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]))
      const updated = new Set(orderedIds)
      const next = prev.map((c) => {
        if (updated.has(c.id)) {
          const idx = orderedIds.indexOf(c.id)
          return { ...c, index: idx + 1, volumeId: volumeId ?? undefined, updatedAt: now }
        }
        return c
      })
      // keep overall sort by index within respective volumes
      next.sort((a, b) => a.index - b.index)
      return next
    })
  }

  // Move a chapter to a target volume (or root) at a target index
  const moveChapter = async (chapterId: string, targetVolumeId: string | null | undefined, targetIndex: number) => {
    if (!projectId) return
    const now = new Date().toISOString()
    const current = chapters.find((c) => c.id === chapterId)
    if (!current) return

    const sourceVolumeId = current.volumeId ?? null

    // Build new orders for source and target lists
    const sourceList = chapters
      .filter((c) => (c.volumeId ?? null) === sourceVolumeId && c.id !== chapterId)
      .sort((a, b) => a.index - b.index)
    const targetList = chapters
      .filter((c) => (c.volumeId ?? null) === (targetVolumeId ?? null) && c.id !== chapterId)
      .sort((a, b) => a.index - b.index)

    // Insert chapter into targetList at targetIndex
    const insertAt = Math.max(0, Math.min(targetIndex, targetList.length))
    targetList.splice(insertAt, 0, { ...current, volumeId: targetVolumeId ?? undefined })

    await db.transaction('rw', db.chapters, async () => {
      // Reindex source list
      for (let i = 0; i < sourceList.length; i++) {
        await db.chapters.update(sourceList[i].id, { index: i + 1, updatedAt: now })
      }
      // Reindex target list (with moved chapter)
      for (let i = 0; i < targetList.length; i++) {
        await db.chapters.update(targetList[i].id, { index: i + 1, volumeId: targetVolumeId ?? undefined, updatedAt: now })
      }
    })

    // Update local state
    setChapters((prev) => {
      const others = prev.filter((c) => c.id !== chapterId)
      const updatedTarget = targetList.map((c, i) => ({ ...c, index: i + 1, volumeId: targetVolumeId ?? undefined, updatedAt: now }))
      const updatedSource = sourceList.map((c, i) => ({ ...c, index: i + 1, updatedAt: now }))
      // Merge unique by id
      const map = new Map<string, typeof prev[number]>()
      for (const c of others) map.set(c.id, c)
      for (const c of updatedSource) map.set(c.id, c)
      for (const c of updatedTarget) map.set(c.id, c)
      return Array.from(map.values()).sort((a, b) => a.index - b.index)
    })
  }

  return {
    volumes,
    chapters,
    loading,
    error,
    getVolumeChapters,
    createVolume,
    createChapter,
    reorderVolumes,
    reorderChapters,
    moveChapter,
  }
}

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

  return {
    volumes,
    chapters,
    loading,
    error,
    getVolumeChapters,
    createVolume,
    createChapter,
  }
}

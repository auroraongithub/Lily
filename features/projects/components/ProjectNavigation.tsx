"use client"

import { useState, useEffect } from 'react'
import { Dropdown } from '@/components/ui/Dropdown'
import { useProjectContext } from '@/features/projects/context/ProjectContext'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useVolumes, useChapters } from '@/features/projects/hooks/useVolumesAndChapters'

export function ProjectNavigation() {
  const { 
    currentProject, 
    currentVolume, 
    currentChapter,
    setCurrentProject,
    setCurrentVolume,
    setCurrentChapter
  } = useProjectContext()
  
  const { projects } = useProjects()
  const { volumes } = useVolumes(currentProject?.id || '')
  const { chapters } = useChapters(currentProject?.id || '')

  const [projectOptions, setProjectOptions] = useState<Array<{ value: string; label: string }>>([])
  const [volumeOptions, setVolumeOptions] = useState<Array<{ value: string; label: string }>>([])
  const [chapterOptions, setChapterOptions] = useState<Array<{ value: string; label: string }>>([])

  // Update project options
  useEffect(() => {
    const options = projects.map(project => ({
      value: project.id,
      label: project.name,
    }))
    setProjectOptions(options)
  }, [projects])

  // Update volume options
  useEffect(() => {
    const options = volumes.map(volume => ({
      value: volume.id,
      label: volume.title,
    }))
    setVolumeOptions(options)
  }, [volumes])

  // Update chapter options - filter by selected volume
  useEffect(() => {
    if (!currentVolume) {
      // No volume selected, show standalone chapters only
      const standaloneChapters = chapters.filter(chapter => !chapter.volumeId)
      const options = standaloneChapters.map(chapter => ({
        value: chapter.id,
        label: chapter.title,
      }))
      setChapterOptions(options)
    } else {
      // Volume selected, show only chapters from that volume
      const volumeChapters = chapters.filter(chapter => chapter.volumeId === currentVolume.id)
      const options = volumeChapters.map(chapter => ({
        value: chapter.id,
        label: chapter.title,
      }))
      setChapterOptions(options)
    }
  }, [chapters, currentVolume])

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setCurrentProject(project)
      setCurrentVolume(null)
      setCurrentChapter(null)
    }
  }

  const handleVolumeChange = (volumeId: string) => {
    const volume = volumes.find(v => v.id === volumeId)
    if (volume) {
      setCurrentVolume(volume)
      setCurrentChapter(null)
    }
  }

  const handleChapterChange = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId)
    if (chapter) {
      setCurrentChapter(chapter)
    }
  }

  return (
    <div className="space-y-2 px-2 pt-3">
      {/* Project Selector */}
      <div>
        <Dropdown
          value={currentProject?.id}
          placeholder="No Project"
          options={projectOptions}
          onSelect={handleProjectChange}
          className="w-full"
        />
      </div>

      {/* Volume Selector - only show if project selected */}
      {currentProject && (
        <div>
          <Dropdown
            value={currentVolume?.id}
            placeholder="Volume"
            options={volumeOptions}
            onSelect={handleVolumeChange}
            className="w-full"
          />
        </div>
      )}
    </div>
  )
}

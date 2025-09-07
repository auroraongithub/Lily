"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Project, Volume, Chapter } from '@/lib/types'

interface ProjectContextValue {
  // Current selections
  currentProject: Project | null
  currentVolume: Volume | null
  currentChapter: Chapter | null
  
  // Actions
  setCurrentProject: (project: Project | null) => void
  setCurrentVolume: (volume: Volume | null) => void
  setCurrentChapter: (chapter: Chapter | null) => void
  
  // Navigation helpers
  navigateToProject: (projectId: string) => void
  navigateToVolume: (projectId: string, volumeId: string) => void
  navigateToChapter: (projectId: string, volumeId: string | undefined, chapterId: string) => void
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

const PROJECT_STORAGE_KEY = 'lily:current-project'
const VOLUME_STORAGE_KEY = 'lily:current-volume'
const CHAPTER_STORAGE_KEY = 'lily:current-chapter'

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [currentVolume, setCurrentVolume] = useState<Volume | null>(null)
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedProject = localStorage.getItem(PROJECT_STORAGE_KEY)
      const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY)
      const savedChapter = localStorage.getItem(CHAPTER_STORAGE_KEY)

      if (savedProject) setCurrentProject(JSON.parse(savedProject))
      if (savedVolume) setCurrentVolume(JSON.parse(savedVolume))
      if (savedChapter) setCurrentChapter(JSON.parse(savedChapter))
    } catch (error) {
      console.warn('Failed to load project context from localStorage:', error)
    }
  }, [])

  // Persist to localStorage when values change
  useEffect(() => {
    try {
      if (currentProject) {
        localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(currentProject))
      } else {
        localStorage.removeItem(PROJECT_STORAGE_KEY)
      }
    } catch (error) {
      console.warn('Failed to save project to localStorage:', error)
    }
  }, [currentProject])


  useEffect(() => {
    try {
      if (currentVolume) {
        localStorage.setItem(VOLUME_STORAGE_KEY, JSON.stringify(currentVolume))
      } else {
        localStorage.removeItem(VOLUME_STORAGE_KEY)
      }
    } catch (error) {
      console.warn('Failed to save volume to localStorage:', error)
    }
  }, [currentVolume])

  useEffect(() => {
    try {
      if (currentChapter) {
        localStorage.setItem(CHAPTER_STORAGE_KEY, JSON.stringify(currentChapter))
      } else {
        localStorage.removeItem(CHAPTER_STORAGE_KEY)
      }
    } catch (error) {
      console.warn('Failed to save chapter to localStorage:', error)
    }
  }, [currentChapter])

  const navigateToProject = (projectId: string) => {
    // Clear child selections when switching projects
    setCurrentVolume(null)
    setCurrentChapter(null)
  }

  const navigateToVolume = (projectId: string, volumeId: string) => {
    // Clear chapter selection when switching volumes
    setCurrentChapter(null)
  }

  const navigateToChapter = (projectId: string, volumeId: string | undefined, chapterId: string) => {
    // Navigation to specific chapter - context should be set by the caller
  }

  const value: ProjectContextValue = {
    currentProject,
    currentVolume,
    currentChapter,
    setCurrentProject,
    setCurrentVolume,
    setCurrentChapter,
    navigateToProject,
    navigateToVolume,
    navigateToChapter,
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider')
  }
  return context
}

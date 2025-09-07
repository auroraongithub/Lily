import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import type { Project } from '@/lib/types'

// Global event emitter for project updates
const projectEventTarget = new EventTarget()

export const triggerProjectsRefresh = () => {
  projectEventTarget.dispatchEvent(new Event('projectsChanged'))
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = async () => {
    try {
      setLoading(true)
      const allProjects = await db.projects.orderBy('updatedAt').reverse().toArray()
      setProjects(allProjects)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (name: string, description?: string) => {
    try {
      const now = new Date().toISOString()
      const project: Project = {
        id: crypto.randomUUID(),
        name,
        description,
        createdAt: now,
        updatedAt: now,
      }
      await db.projects.add(project)
      await loadProjects()
      triggerProjectsRefresh()
      return project
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      throw err
    }
  }

  const updateProject = async (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>) => {
    try {
      const updatedAt = new Date().toISOString()
      await db.projects.update(id, { ...updates, updatedAt })
      await loadProjects()
      triggerProjectsRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
      throw err
    }
  }

  const deleteProject = async (id: string) => {
    try {
      // Delete all related data
      await db.transaction('rw', [db.projects, db.volumes, db.chapters], async () => {
        // Delete all chapters for this project
        await db.chapters.where('projectId').equals(id).delete()
        
        // Delete all volumes for this project
        await db.volumes.where('projectId').equals(id).delete()
        
        // Delete the project
        await db.projects.delete(id)
      })
      await loadProjects()
      triggerProjectsRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
      throw err
    }
  }

  useEffect(() => {
    loadProjects()
    
    // Listen for global project updates
    const handleProjectsChanged = () => {
      loadProjects()
    }
    
    projectEventTarget.addEventListener('projectsChanged', handleProjectsChanged)
    
    return () => {
      projectEventTarget.removeEventListener('projectsChanged', handleProjectsChanged)
    }
  }, [])

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refresh: loadProjects,
  }
}

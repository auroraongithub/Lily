import { useState, useEffect, useCallback } from 'react'
import { db } from '../../../lib/db'
import type { MindMapWorkspace } from '../../../lib/types'

export function useMindMapWorkspace(projectId: string) {
  const [workspace, setWorkspace] = useState<MindMapWorkspace | null>(null)
  const [loading, setLoading] = useState(true)

  const loadWorkspace = useCallback(async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      let projectWorkspace = await db.mindMapWorkspaces
        .where('projectId')
        .equals(projectId)
        .first()

      if (!projectWorkspace) {
        // Create default workspace
        const now = new Date().toISOString()
        projectWorkspace = {
          id: crypto.randomUUID(),
          projectId,
          name: 'Main Mind Map',
          zoomLevel: 1,
          viewportPosition: { x: 0, y: 0 },
          backgroundColor: 'transparent',
          gridVisible: true,
          snapToGrid: false,
          createdAt: now,
          updatedAt: now,
        }
        await db.mindMapWorkspaces.add(projectWorkspace)
      }

      setWorkspace(projectWorkspace)
    } catch (error) {
      console.error('Failed to load mind map workspace:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const updateWorkspace = useCallback(async (updates: Partial<MindMapWorkspace>) => {
    if (!workspace) return

    const updatedWorkspace = {
      ...workspace,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    try {
      await db.mindMapWorkspaces.update(workspace.id, updatedWorkspace)
      setWorkspace(updatedWorkspace)
    } catch (error) {
      console.error('Failed to update mind map workspace:', error)
      throw error
    }
  }, [workspace])

  useEffect(() => {
    loadWorkspace()
  }, [loadWorkspace])

  return {
    workspace,
    loading,
    updateWorkspace,
    reload: loadWorkspace,
  }
}

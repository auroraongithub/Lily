import { useState, useEffect, useCallback } from 'react'
import { db } from '../../../lib/db'
import type { MindMapEdge } from '../../../lib/types'

export function useMindMapEdges(projectId: string) {
  const [edges, setEdges] = useState<MindMapEdge[]>([])
  const [loading, setLoading] = useState(true)

  const loadEdges = useCallback(async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      const projectEdges = await db.mindMapEdges
        .where('projectId')
        .equals(projectId)
        .toArray()
      setEdges(projectEdges)
    } catch (error) {
      console.error('Failed to load mind map edges:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const createEdge = useCallback(async (edgeData: Omit<MindMapEdge, 'id' | 'createdAt'>) => {
    const edge: MindMapEdge = {
      ...edgeData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    try {
      await db.mindMapEdges.add(edge)
      setEdges(prev => [...prev, edge])
      return edge
    } catch (error) {
      console.error('Failed to create mind map edge:', error)
      throw error
    }
  }, [])

  const updateEdge = useCallback(async (id: string, updates: Partial<MindMapEdge>) => {
    const updatedEdge = {
      ...updates,
      id,
    }

    try {
      await db.mindMapEdges.update(id, updatedEdge)
      setEdges(prev => prev.map(edge => 
        edge.id === id ? { ...edge, ...updatedEdge } : edge
      ))
    } catch (error) {
      console.error('Failed to update mind map edge:', error)
      throw error
    }
  }, [])

  const deleteEdge = useCallback(async (id: string) => {
    try {
      await db.mindMapEdges.delete(id)
      setEdges(prev => prev.filter(edge => edge.id !== id))
    } catch (error) {
      console.error('Failed to delete mind map edge:', error)
      throw error
    }
  }, [])

  const deleteNodeEdges = useCallback(async (nodeId: string) => {
    try {
      await db.mindMapEdges
        .where('sourceNodeId').equals(nodeId)
        .or('targetNodeId').equals(nodeId)
        .delete()
      
      setEdges(prev => prev.filter(edge => 
        edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
      ))
    } catch (error) {
      console.error('Failed to delete node edges:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    loadEdges()
  }, [loadEdges])

  return {
    edges,
    loading,
    createEdge,
    updateEdge,
    deleteEdge,
    deleteNodeEdges,
    reload: loadEdges,
  }
}

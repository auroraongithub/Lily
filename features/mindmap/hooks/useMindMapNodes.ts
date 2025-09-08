import { useState, useEffect, useCallback } from 'react'
import { db } from '../../../lib/db'
import type { MindMapNode } from '../../../lib/types'

export function useMindMapNodes(projectId: string) {
  const [nodes, setNodes] = useState<MindMapNode[]>([])
  const [loading, setLoading] = useState(true)

  const loadNodes = useCallback(async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      const projectNodes = await db.mindMapNodes
        .where('projectId')
        .equals(projectId)
        .toArray()
      setNodes(projectNodes)
    } catch (error) {
      console.error('Failed to load mind map nodes:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const createNode = useCallback(async (nodeData: Omit<MindMapNode, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const node: MindMapNode = {
      ...nodeData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }

    try {
      await db.mindMapNodes.add(node)
      setNodes(prev => [...prev, node])
      return node
    } catch (error) {
      console.error('Failed to create mind map node:', error)
      throw error
    }
  }, [])

  const updateNode = useCallback(async (id: string, updates: Partial<MindMapNode>) => {
    const updatedNode = {
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }

    try {
      await db.mindMapNodes.update(id, updatedNode)
      setNodes(prev => prev.map(node => 
        node.id === id ? { ...node, ...updatedNode } : node
      ))
    } catch (error) {
      console.error('Failed to update mind map node:', error)
      throw error
    }
  }, [])

  const deleteNode = useCallback(async (id: string) => {
    try {
      await db.mindMapNodes.delete(id)
      // Also delete associated edges
      await db.mindMapEdges
        .where('sourceNodeId').equals(id)
        .or('targetNodeId').equals(id)
        .delete()
      
      setNodes(prev => prev.filter(node => node.id !== id))
    } catch (error) {
      console.error('Failed to delete mind map node:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    loadNodes()
  }, [loadNodes])

  return {
    nodes,
    loading,
    createNode,
    updateNode,
    deleteNode,
    reload: loadNodes,
  }
}

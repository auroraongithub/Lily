import { useCallback, useEffect, useState } from 'react'
import { db } from '../../../lib/db'
import type { MindMapCustomType } from '../../../lib/types'

export function useMindMapCustomTypes(projectId: string) {
  const [types, setTypes] = useState<MindMapCustomType[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!projectId) return
    try {
      setLoading(true)
      const all = await db.mindMapCustomTypes.where('projectId').equals(projectId).toArray()
      // sort by name
      all.sort((a, b) => a.name.localeCompare(b.name))
      setTypes(all)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const createType = useCallback(async (data: Omit<MindMapCustomType, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString()
    const type: MindMapCustomType = { ...data, id: crypto.randomUUID(), createdAt: now }
    await db.mindMapCustomTypes.add(type)
    setTypes(prev => [...prev, type].sort((a, b) => a.name.localeCompare(b.name)))
    return type
  }, [])

  const deleteType = useCallback(async (id: string) => {
    await db.mindMapCustomTypes.delete(id)
    setTypes(prev => prev.filter(t => t.id !== id))
  }, [])

  const updateType = useCallback(async (id: string, updates: Partial<MindMapCustomType>) => {
    await db.mindMapCustomTypes.update(id, updates)
    setTypes(prev => prev.map(t => (t.id === id ? { ...t, ...updates } as MindMapCustomType : t)))
  }, [])

  useEffect(() => { reload() }, [reload])

  return { types, loading, reload, createType, deleteType, updateType }
}

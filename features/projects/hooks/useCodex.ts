"use client"

import { useEffect, useMemo, useState } from 'react'
import { db } from '@/lib/db'
import type { Chapter, EntityMention, EntityProgressPoint, WorldbuildingEntity } from '@/lib/types'

export interface UseCodex {
  entities: WorldbuildingEntity[]
  mentions: EntityMention[]
  progress: EntityProgressPoint[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  updateEntityMeta: (id: string, updates: Partial<Pick<WorldbuildingEntity, 'aliases' | 'highlightColor' | 'name' | 'description'>>) => Promise<void>
  scanMentions: () => Promise<void>
  getMentionCountByEntity: (entityId: string) => number
  getMentionsForEntity: (entityId: string) => EntityMention[]
  importEntitiesFromMindMap: () => Promise<{ created: number, skipped: number }>
  createEntity: (input: { name: string; type: WorldbuildingEntity['type']; highlightColor?: string; aliases?: string[]; description?: string }) => Promise<WorldbuildingEntity | null>
  deleteEntity: (entityId: string) => Promise<void>
}

export function useCodex(projectId: string | null): UseCodex {
  const [entities, setEntities] = useState<WorldbuildingEntity[]>([])
  const [mentions, setMentions] = useState<EntityMention[]>([])
  const [progress, setProgress] = useState<EntityProgressPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [es, ms, ps] = await Promise.all([
        db.worldbuildingEntities.where('projectId').equals(projectId).toArray(),
        db.entityMentions.where('projectId').equals(projectId).toArray(),
        db.entityProgressPoints.where('projectId').equals(projectId).toArray(),
      ])
      setEntities(es)
      setMentions(ms)
      setProgress(ps)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Codex data')
    } finally {
      setLoading(false)
    }
  }

  const createEntity = async (input: { name: string; type: WorldbuildingEntity['type']; highlightColor?: string; aliases?: string[]; description?: string }) => {
    if (!projectId) return null
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const color = input.highlightColor || '#FFD54F'
    const entity: WorldbuildingEntity = {
      id,
      projectId,
      type: input.type,
      name: input.name.trim(),
      description: input.description,
      image: undefined,
      fallbackColor: color,
      aliases: input.aliases || [],
      highlightColor: color,
      position: { x: 0, y: 0 },
      tags: [],
      connections: [],
      linkedChapters: [],
      customFields: {},
      createdAt: now,
      updatedAt: now,
    }
    await db.worldbuildingEntities.add(entity)
    await reload()
    return entity
  }

  const deleteEntity = async (entityId: string) => {
    if (!projectId) return
    await db.transaction('rw', [db.worldbuildingEntities, db.entityMentions, db.entityProgressPoints], async () => {
      await db.entityMentions.where('entityId').equals(entityId).delete()
      await db.entityProgressPoints.where('entityId').equals(entityId).delete()
      await db.worldbuildingEntities.delete(entityId)
    })
    await reload()
  }


  useEffect(() => {
    if (!projectId) {
      setEntities([])
      setMentions([])
      setProgress([])
      return
    }
    void reload()
  }, [projectId])

  const updateEntityMeta = async (id: string, updates: Partial<Pick<WorldbuildingEntity, 'aliases' | 'highlightColor' | 'name' | 'description'>>) => {
    if (!projectId) return
    const updatedAt = new Date().toISOString()
    await db.worldbuildingEntities.update(id, { ...updates, updatedAt })
    await reload()
  }

  // Extract plain text from a serialized Lexical document string
  function extractTextFromLexical(content: string): string {
    try {
      const json = JSON.parse(content)
      const root = json?.root
      let out = ''
      const walk = (node: any) => {
        if (!node) return
        if (node.type === 'text' && typeof node.text === 'string') {
          out += node.text
        }
        if (Array.isArray(node.children)) {
          for (const child of node.children) {
            walk(child)
            if (child.type === 'paragraph' || child.type === 'linebreak') out += '\n'
          }
        }
      }
      walk(root)
      return out || ''
    } catch {
      // Fallback: treat content as already-plain
      return content || ''
    }
  }

  const buildPatterns = (entities: WorldbuildingEntity[]) => {
    return entities.map((e) => {
      const names = [e.name, ...(e.aliases || [])].filter(Boolean) as string[]
      const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      // word boundary match; allow possessives and punctuation following
      const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')
      return { entity: e, pattern }
    })
  }

  const scanMentions = async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [es, chaps] = await Promise.all([
        db.worldbuildingEntities.where('projectId').equals(projectId).toArray(),
        db.chapters.where('projectId').equals(projectId).toArray(),
      ])
      // sort chapters by index for stability
      chaps.sort((a, b) => a.index - b.index)
      const patterns = buildPatterns(es)

      // Clear existing mentions for this project then rebuild
      await db.entityMentions.where('projectId').equals(projectId).delete()

      const toInsert: EntityMention[] = []
      for (const chapter of chaps) {
        let plain = ''
        if (chapter.documentId) {
          const doc = await db.documents.get(chapter.documentId)
          if (doc?.content) plain = extractTextFromLexical(doc.content)
        }
        // Fallback to chapter title if content missing
        if (!plain && chapter.title) plain = chapter.title
        if (!plain) continue

        for (const { entity, pattern } of patterns) {
          pattern.lastIndex = 0
          let m: RegExpExecArray | null
          while ((m = pattern.exec(plain)) !== null) {
            const idx = m.index
            const matchedText = m[0]
            const id = crypto.randomUUID()
            const now = new Date().toISOString()
            toInsert.push({
              id,
              projectId,
              entityId: entity.id,
              chapterId: chapter.id,
              position: idx,
              length: matchedText.length,
              matchedText,
              createdAt: now,
              updatedAt: now,
            })
          }
        }
      }

      if (toInsert.length > 0) {
        await db.entityMentions.bulkAdd(toInsert)
      }
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan mentions')
    } finally {
      setLoading(false)
    }
  }

  const getMentionCountByEntity = (entityId: string) => mentions.filter(m => m.entityId === entityId).length
  const getMentionsForEntity = (entityId: string) => mentions.filter(m => m.entityId === entityId).sort((a, b) => a.position - b.position)

  const importEntitiesFromMindMap = async () => {
    if (!projectId) return { created: 0, skipped: 0 }
    const now = new Date().toISOString()
    // Load nodes and existing entities
    const [nodes, existing] = await Promise.all([
      db.mindMapNodes.where('projectId').equals(projectId).toArray(),
      db.worldbuildingEntities.where('projectId').equals(projectId).toArray(),
    ])
    const existingByName = new Map(existing.map(e => [e.name.toLowerCase(), e]))
    const candidates = nodes.filter(n => ['character','location','custom','note','event','faction','item'].includes(n.type))

    let created = 0, skipped = 0
    for (const n of candidates) {
      const name = n.title?.trim()
      if (!name) { skipped++; continue }
      if (existingByName.has(name.toLowerCase())) { skipped++; continue }
      const typeMap: Record<string, WorldbuildingEntity['type']> = {
        character: 'character',
        location: 'location',
        faction: 'faction',
        item: 'item',
        event: 'custom',
        note: 'custom',
        custom: 'custom',
      }
      const type = typeMap[n.type] || 'custom'
      await db.worldbuildingEntities.add({
        id: crypto.randomUUID(),
        projectId,
        type,
        name,
        description: n.description,
        image: n.image,
        fallbackColor: n.color,
        aliases: [],
        highlightColor: n.color,
        position: { x: 0, y: 0 },
        tags: [],
        connections: [],
        linkedChapters: [],
        customFields: n.customFields || {},
        createdAt: now,
        updatedAt: now,
      })
      created++
    }
    await reload()
    return { created, skipped }
  }

  return {
    entities,
    mentions,
    progress,
    loading,
    error,
    reload,
    updateEntityMeta,
    scanMentions,
    getMentionCountByEntity,
    getMentionsForEntity,
    importEntitiesFromMindMap,
    createEntity,
    deleteEntity,
  }
}

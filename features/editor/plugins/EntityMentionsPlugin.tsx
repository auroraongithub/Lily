"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { db } from '@/lib/db'
import type { EntityMention, WorldbuildingEntity, Chapter } from '@/lib/types'

interface EntityMentionsPluginProps {
  documentId: string
  enabled?: boolean
  enabledTypes?: Array<WorldbuildingEntity['type']>
}

// Utility: build patterns from entities (name + aliases)
function buildPatterns(entities: WorldbuildingEntity[]) {
  return entities.map((e) => {
    const names = [e.name, ...(e.aliases || [])].filter(Boolean) as string[]
    if (names.length === 0) return null
    const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')
    const color = e.highlightColor || e.fallbackColor || '#FFD54F'
    return { entity: e, pattern, color }
  }).filter(Boolean) as Array<{ entity: WorldbuildingEntity; pattern: RegExp; color: string }>
}

export function EntityMentionsPlugin({ documentId, enabled = true, enabledTypes = ['character','location','faction','item','custom'] }: EntityMentionsPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [chapterId, setChapterId] = useState<string | null>(null)
  const [entities, setEntities] = useState<WorldbuildingEntity[]>([])
  const [mentions, setMentions] = useState<EntityMention[]>([])
  const [ready, setReady] = useState(false)

  // Keep a ref to CSS Highlights availability
  const cssHighlightsSupported = typeof (window as any).CSS !== 'undefined' && (CSS as any).highlights
  const styleTagRef = useRef<HTMLStyleElement | null>(null)

  // Load chapterId and entities for project
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const chapter = await db.chapters.where('documentId').equals(documentId).first()
      if (!chapter) { setChapterId(null); setEntities([]); setReady(true); return }
      const es = await db.worldbuildingEntities.where('projectId').equals(chapter.projectId).toArray()
      if (!cancelled) {
        setChapterId(chapter.id)
        setEntities(es)
        setReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [documentId])

  // Load mentions for current chapter
  useEffect(() => {
    if (!chapterId) { setMentions([]); return }
    let cancelled = false
    ;(async () => {
      const list = await db.entityMentions.where('chapterId').equals(chapterId).toArray()
      if (!cancelled) setMentions(list)
    })()
    return () => { cancelled = true }
  }, [chapterId])

  // Build patterns and dynamic ::highlight styles
  const patterns = useMemo(() => buildPatterns(entities.filter(e => enabledTypes.includes(e.type))), [entities, enabledTypes])

  useEffect(() => {
    if (!cssHighlightsSupported) return
    // Build/update a style tag with ::highlight rules for each entity id
    if (!styleTagRef.current) {
      const tag = document.createElement('style')
      tag.setAttribute('data-codex-mentions', 'true')
      document.head.appendChild(tag)
      styleTagRef.current = tag
    }
    const rules = patterns.map(({ entity, color }) => `::highlight(entity-${entity.id}) { background-color: ${color}; border-radius: 2px; }`).join('\n')
    styleTagRef.current!.textContent = rules
    return () => {
      // keep style tag for future updates; do not remove
    }
  }, [patterns, cssHighlightsSupported])

  // Compute text node map and apply CSS Highlights on editor updates
  useEffect(() => {
    if (!ready) return
    if (!enabled) {
      // clear highlights if disabled
      try {
        for (const { entity } of patterns) {
          ;(CSS as any).highlights.delete(`entity-${entity.id}`)
        }
      } catch {}
      return
    }
    // Fallback span elements list
    const createdSpans: HTMLSpanElement[] = []

    if (!cssHighlightsSupported) {
      const unregister = editor.registerUpdateListener(() => {
        const rootEl = editor.getRootElement()
        if (!rootEl) return
        // cleanup previous spans
        for (const s of createdSpans) { try { s.replaceWith(...Array.from(s.childNodes)) } catch {} }
        createdSpans.length = 0

        // Collect DOM text nodes in order
        const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT)
        const domTextNodes: Text[] = []
        let curr: Node | null
        while ((curr = walker.nextNode())) {
          if (curr.nodeType === Node.TEXT_NODE && curr.nodeValue && curr.nodeValue.length > 0) {
            domTextNodes.push(curr as Text)
          }
        }
        const parts = domTextNodes.map(n => n.nodeValue || '')
        const lengths = parts.map(p => p.length)
        const full = parts.join('')

        const pushRanges = (start: number, len: number, ranges: Array<{ node: Text; start: number; end: number }>) => {
          let remaining = len
          let cursor = 0
          let nodeIndex = 0
          while (nodeIndex < lengths.length && (cursor + (lengths[nodeIndex] || 0)) <= start) {
            cursor += (lengths[nodeIndex] || 0)
            nodeIndex++
          }
          if (nodeIndex >= domTextNodes.length) return
          let offsetInNode = start - cursor
          while (remaining > 0 && nodeIndex < domTextNodes.length) {
            const node = domTextNodes[nodeIndex]
            if (!node) break
            const take = Math.min(remaining, ((node.nodeValue?.length) || 0) - offsetInNode)
            if (take <= 0) break
            ranges.push({ node, start: offsetInNode, end: offsetInNode + take })
            remaining -= take
            nodeIndex += 1
            offsetInNode = 0
          }
        }

        for (const { entity, pattern, color } of patterns) {
          if (!pattern) continue
          const segments: Array<{ node: Text; start: number; end: number }> = []
          let m: RegExpExecArray | null
          while ((m = pattern.exec(full)) !== null) {
            pushRanges(m.index, m[0].length, segments)
          }
          // wrap each segment in a span with background
          for (const seg of segments) {
            const { node, start, end } = seg
            try {
              const r = new Range()
              r.setStart(node, start)
              r.setEnd(node, end)
              const span = document.createElement('span')
              span.className = 'codex-mention-highlight'
              span.style.backgroundColor = color
              span.style.borderRadius = '2px'
              span.style.padding = '0 0'
              r.surroundContents(span)
              createdSpans.push(span)
            } catch {}
          }
        }
      })

      return () => {
        unregister()
        for (const s of createdSpans) { try { s.replaceWith(...Array.from(s.childNodes)) } catch {} }
      }
    }

    if (!cssHighlightsSupported) return

    const unregister = editor.registerUpdateListener(({ editorState }) => {
      // Ensure we use the latest DOM tree for highlights
      const rootEl = editor.getRootElement()
      if (!rootEl) return

      // 1. Collect DOM text nodes in order
      const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT)
      const domTextNodes: Text[] = []
      let curr: Node | null
      while ((curr = walker.nextNode())) {
        // Only consider text nodes with non-empty content
        if (curr.nodeType === Node.TEXT_NODE && curr.nodeValue && curr.nodeValue.length > 0) {
          domTextNodes.push(curr as Text)
        }
      }

      // 2. Build the full text and per-node lengths
      const parts = domTextNodes.map(n => n.nodeValue || '')
      const lengths = parts.map(p => p.length)
      const full = parts.join('')

      // Clear previous highlights for our entities
      try {
        for (const { entity } of patterns) {
          ;(CSS as any).highlights.delete(`entity-${entity.id}`)
        }
      } catch {}

      // Helper to push ranges for a (start,len) in concatenated text
      const pushRanges = (start: number, len: number, ranges: Range[]) => {
        let remaining = len
        let cursor = 0
        let nodeIndex = 0
        while (nodeIndex < lengths.length && (cursor + (lengths[nodeIndex] || 0)) <= start) {
          cursor += (lengths[nodeIndex] || 0)
          nodeIndex++
        }
        if (nodeIndex >= domTextNodes.length) return
        let offsetInNode = start - cursor
        while (remaining > 0 && nodeIndex < domTextNodes.length) {
          const node = domTextNodes[nodeIndex]
          if (!node) break
          const take = Math.min(remaining, ((node.nodeValue?.length) || 0) - offsetInNode)
          if (take <= 0) break
          const r = new Range()
          try {
            r.setStart(node, offsetInNode)
            r.setEnd(node, offsetInNode + take)
            ranges.push(r)
          } catch {}
          remaining -= take
          nodeIndex += 1
          offsetInNode = 0
        }
      }

      // Always use real-time regex patterns so highlights respond as you type
      for (const { entity, pattern } of patterns) {
        const ranges: Range[] = []
        if (!pattern) continue
        let m: RegExpExecArray | null
        while ((m = pattern.exec(full)) !== null) {
          pushRanges(m.index, m[0].length, ranges)
        }
        if (ranges.length > 0) {
          try {
            const highlight = new (window as any).Highlight(...ranges)
            ;(CSS as any).highlights.set(`entity-${entity.id}`, highlight)
          } catch {}
        }
      }
    
    })

    return () => {
      unregister()
      try {
        for (const { entity } of patterns) {
          (CSS as any).highlights.delete(`entity-${entity.id}`)
        }
      } catch {}
    }
  }, [editor, ready, enabled, patterns, cssHighlightsSupported])

  return null
}

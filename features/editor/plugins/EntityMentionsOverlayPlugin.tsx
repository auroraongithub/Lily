"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { db } from '@/lib/db'
import type { WorldbuildingEntity } from '@/lib/types'

interface EntityMentionsOverlayPluginProps {
  documentId: string
  enabled?: boolean
  enabledTypes?: Array<WorldbuildingEntity['type']>
  opacity?: number // 0..1
}

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

export function EntityMentionsOverlayPlugin({ documentId, enabled = true, enabledTypes = ['character','location','faction','item','custom'], opacity = 0.35 }: EntityMentionsOverlayPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [entities, setEntities] = useState<WorldbuildingEntity[]>([])
  const overlayRef = useRef<HTMLDivElement | null>(null)

  // Load entities for the project using the chapter's projectId
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const chapter = await db.chapters.where('documentId').equals(documentId).first()
      if (!chapter) { if (!cancelled) setEntities([]); return }
      const es = await db.worldbuildingEntities.where('projectId').equals(chapter.projectId).toArray()
      if (!cancelled) setEntities(es)
    })()
    return () => { cancelled = true }
  }, [documentId])

  const patterns = useMemo(() => buildPatterns(entities.filter(e => enabledTypes.includes(e.type))), [entities, enabledTypes])

  useEffect(() => {
    if (!enabled) {
      // cleanup any overlay rectangles
      const ov = overlayRef.current
      if (ov) ov.innerHTML = ''
      return
    }

    const cleanupRects = () => {
      const ov = overlayRef.current
      if (ov) ov.innerHTML = ''
    }

    const renderRects = () => {
      const rootEl = editor.getRootElement()
      if (!rootEl) return
      const anchor = rootEl.parentElement // same relative container as ContentEditable
      if (!anchor) return
      // Ensure anchor is a positioned container for absolute overlay
      const cs = window.getComputedStyle(anchor)
      if (cs.position === 'static') {
        anchor.style.position = 'relative'
      }

      // Ensure overlay exists and is sized/positioned properly
      let ov = overlayRef.current
      if (!ov) {
        ov = document.createElement('div')
        ov.style.position = 'absolute'
        ov.style.inset = '0'
        ov.style.pointerEvents = 'none'
        ov.style.zIndex = '5' // above content backgrounds and under caret/selection
        ov.setAttribute('data-codex-overlay', 'true')
        anchor.appendChild(ov)
        overlayRef.current = ov
      }
      // reset
      ov.innerHTML = ''

      // Collect text nodes
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

      // Helper: push absolute rects for a (start,len)
      const pushRects = (start: number, len: number, color: string) => {
        const containerRect = anchor.getBoundingClientRect()
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
            const rects = r.getClientRects()
            for (const rect of Array.from(rects)) {
              const hl = document.createElement('div')
              hl.style.position = 'absolute'
              hl.style.left = `${rect.left - containerRect.left}px`
              hl.style.top = `${rect.top - containerRect.top}px`
              hl.style.width = `${rect.width}px`
              hl.style.height = `${rect.height}px`
              hl.style.borderRadius = '3px'
              hl.style.backgroundColor = color
              hl.style.opacity = `${opacity}`
              hl.style.mixBlendMode = 'multiply'
              hl.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.08)'
              ov!.appendChild(hl)
            }
          } catch {}
          remaining -= take
          nodeIndex += 1
          offsetInNode = 0
        }
      }

      // Build rectangles for each entity pattern in real time
      for (const { entity, pattern, color } of patterns) {
        if (!pattern) continue
        let m: RegExpExecArray | null
        while ((m = pattern.exec(full)) !== null) {
          pushRects(m.index, m[0].length, color)
        }
      }
    }

    // Update on editor state changes, scroll and resize
    const unregister = editor.registerUpdateListener(() => {
      cleanupRects()
      renderRects()
    })

    const onScrollOrResize = () => { cleanupRects(); renderRects() }
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)

    // Initial render once editor mounts
    renderRects()

    return () => {
      unregister()
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
      cleanupRects()
    }
  }, [editor, enabled, patterns, opacity])

  return null
}

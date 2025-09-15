"use client"

import {useEffect} from 'react'
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext'
import { $getRoot, $isTextNode, type TextNode } from 'lexical'

export interface HighlightItem {
  key: string
  text: string
}

interface HighlightsPluginProps {
  onHighlightsChange?: (items: HighlightItem[]) => void
}

function removeStyleProp(style: string, prop: string): string {
  // crude but effective inline-style removal
  const parts = style
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.toLowerCase().startsWith(prop.toLowerCase() + ':'))
  return parts.length ? parts.join('; ') + ';' : ''
}

export function HighlightsPlugin({ onHighlightsChange }: HighlightsPluginProps) {
  const [editor] = useLexicalComposerContext()

  const hasEffectiveBackground = (style: string): boolean => {
    const m = /background-color\s*:\s*([^;]+)/i.exec(style)
    if (!m) return false
    const group = m[1] ?? ''
    const val = group.trim().toLowerCase()
    if (!val) return false
    if (/(transparent|inherit|unset|initial)/i.test(val)) return false
    if (/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/i.test(val)) return false
    return true
  }

  useEffect(() => {
    // Collect highlights on every update
    return editor.registerUpdateListener(({editorState}) => {
      if (!onHighlightsChange) return
      editorState.read(() => {
        const root = $getRoot()
        const items: HighlightItem[] = []
        const added = new Set<string>()

        const walk = (node: any) => {
          const children = node.getChildren?.() || []
          for (const child of children) {
            if ($isTextNode(child)) {
              const style = (child as TextNode).getStyle() || ''
              if (hasEffectiveBackground(style) && child.getTextContent().trim()) {
                // Prefer parent element key for better scrollIntoView mapping
                const parent = (child as TextNode).getParent()
                const key = parent ? parent.getKey() : child.getKey()
                if (!added.has(key)) {
                  items.push({ key, text: child.getTextContent().slice(0, 80) })
                  added.add(key)
                }
              }
            }
            if (child.getChildren) walk(child)
          }
        }
        walk(root)
        onHighlightsChange(items)
      })
    })
  }, [editor, onHighlightsChange])

  useEffect(() => {
    const onClear = () => {
      editor.update(() => {
        const root = $getRoot()
        const walk = (node: any) => {
          const children = node.getChildren?.() || []
          for (const child of children) {
            if ($isTextNode(child)) {
              const style = (child as TextNode).getStyle() || ''
              if (/background\-color/i.test(style)) {
                const cleaned = removeStyleProp(style, 'background-color')
                ;(child as TextNode).setStyle(cleaned)
              }
            }
            if (child.getChildren) walk(child)
          }
        }
        walk(root)
      })
    }

    const handler = (e: Event) => onClear()
    window.addEventListener('lily:editor:clearHighlights', handler)
    return () => window.removeEventListener('lily:editor:clearHighlights', handler)
  }, [editor])

  return null
}

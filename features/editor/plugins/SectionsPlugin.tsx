"use client"

import {useEffect} from 'react'
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
import { HeadingNode } from '@lexical/rich-text'

export interface SectionItem {
  key: string
  text: string
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

interface SectionsPluginProps {
  onSectionsChange?: (items: SectionItem[]) => void
}

export function SectionsPlugin({ onSectionsChange }: SectionsPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerUpdateListener(({editorState}) => {
      if (!onSectionsChange) return
      editorState.read(() => {
        const root = $getRoot()
        const items: SectionItem[] = []
        const walk = (node: any) => {
          const children = node.getChildren?.() || []
          for (const child of children) {
            if (child instanceof HeadingNode) {
              const tag = child.getTag() as SectionItem['tag']
              const text = child.getTextContent().trim()
              if (text) items.push({ key: child.getKey(), text, tag })
            }
            if (child.getChildren) walk(child)
          }
        }
        walk(root)
        onSectionsChange(items)
      })
    })
  }, [editor, onSectionsChange])

  return null
}

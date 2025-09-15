"use client"

import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export function ScrollToKeyPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key: string } | undefined
      const key = detail?.key
      if (!key) return
      editor.getEditorState().read(() => {
        const elem = editor.getElementByKey(key)
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    }

    window.addEventListener('lily:editor:scrollToKey' as any, handler)
    return () => window.removeEventListener('lily:editor:scrollToKey' as any, handler)
  }, [editor])

  return null
}

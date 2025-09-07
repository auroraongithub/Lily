"use client"

import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  KEY_DOWN_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical'

/**
 * KeyboardShortcutsPlugin
 * - Ctrl/Cmd + B: Bold
 * - Ctrl/Cmd + I: Italic
 * - Ctrl/Cmd + U: Underline
 * - Ctrl/Cmd + Shift + X: Strikethrough (common convention)
 * - Alt + Shift + 5: Strikethrough (Google Docs convention)
 * - Tab: indent current block (if supported), else insert 6 NBSPs for a clear visual indent
 * - Shift + Tab: outdent current block (if supported), else remove up to 6 preceding NBSPs
 */
export function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        const isMod = event.metaKey || event.ctrlKey
        const key = event.key

        // Text formatting shortcuts
        if (isMod) {
          const lower = key.toLowerCase()
          // Save: Ctrl/Cmd + S
          if (lower === 's') {
            event.preventDefault()
            try {
              window.dispatchEvent(new Event('editor:save-now'))
            } catch {}
            return true
          }
          if (lower === 'b') {
            event.preventDefault()
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
            return true
          }
          if (lower === 'i') {
            event.preventDefault()
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
            return true
          }
          if (lower === 'u') {
            event.preventDefault()
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
            return true
          }
          if (event.shiftKey && lower === 'x') {
            event.preventDefault()
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
            return true
          }
        }

        // Alternate strikethrough: Alt+Shift+5
        if (event.altKey && event.shiftKey && key === '5') {
          event.preventDefault()
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
          return true
        }

        // Tab handling: try structural indent/outdent first, fallback to EM spaces for clear visual change
        if (key === 'Tab') {
          event.preventDefault()
          if (event.shiftKey) {
            // First try structural outdent
            const handled = editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
            if (!handled) {
              // If immediately before caret there are EM spaces, remove up to 2 of them
              editor.update(() => {
                const selection = $getSelection()
                if ($isRangeSelection(selection) && selection.isCollapsed()) {
                  const anchor = selection.anchor
                  const node = anchor.getNode()
                  const offset = anchor.offset
                  if (node.getType() === 'text') {
                    const text = node.getTextContent().slice(0, offset)
                    const EMSPACE = '\u2003'
                    let count = 0
                    for (let i = 1; i <= 2; i++) {
                      if (text[text.length - i] === EMSPACE) count++
                      else break
                    }
                    for (let i = 0; i < count; i++) selection.deleteCharacter(true)
                  }
                }
              })
            }
            return true
          }
          // First try structural indent
          const handled = editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
          if (!handled) {
            // Insert 2 EM spaces to make indent very visible
            editor.update(() => {
              const selection = $getSelection()
              if ($isRangeSelection(selection)) {
                selection.insertText('\u2003\u2003')
              }
            })
          }
          return true
        }

        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])

  return null
}

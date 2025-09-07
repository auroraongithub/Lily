"use client"

import {useCallback, useEffect} from 'react'
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext'
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  $getSelection,
  $isRangeSelection,
  $insertNodes,
  PASTE_COMMAND,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
} from 'lexical'
import { $createImageNode, type ImagePayload } from '../nodes/ImageNode'

export const INSERT_IMAGE_COMMAND = createCommand<ImagePayload>('INSERT_IMAGE_COMMAND')

export function ImagePlugin() {
  const [editor] = useLexicalComposerContext()

  // Handle image insert command
  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) return false
          const node = $createImageNode(payload)
          $insertNodes([node])
        })
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  const insertFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = () => {
        const src = typeof reader.result === 'string' ? reader.result : ''
        if (!src) return
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src, altText: file.name })
      }
      reader.readAsDataURL(file)
    })
  }, [editor])

  // Paste images from clipboard
  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const dt = event.clipboardData
        if (!dt) return false
        const files = dt.files
        if (files && files.length > 0) {
          event.preventDefault()
          insertFiles(files)
          return true
        }
        return false
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor, insertFiles])

  // Allow dropping by preventing default on dragover
  useEffect(() => {
    return editor.registerCommand(
      DRAGOVER_COMMAND,
      (event: DragEvent) => {
        if (event.dataTransfer && event.dataTransfer.types.includes('Files')) {
          event.preventDefault()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  // Handle drop files
  useEffect(() => {
    return editor.registerCommand(
      DROP_COMMAND,
      (event: DragEvent) => {
        const dt = event.dataTransfer
        if (!dt) return false
        const files = dt.files
        if (files && files.length > 0) {
          event.preventDefault()
          insertFiles(files)
          return true
        }
        return false
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor, insertFiles])

  return null
}

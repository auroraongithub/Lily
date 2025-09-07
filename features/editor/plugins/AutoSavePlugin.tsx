"use client"

import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
import { db } from '@/lib/db'
import type { EditorDocument } from '../types'

interface AutoSavePluginProps {
  documentId: string
  onSave: (document: Partial<EditorDocument>) => void
  interval?: number // Auto-save interval in milliseconds
}

export function AutoSavePlugin({ 
  documentId, 
  onSave, 
  interval = 3000 // Default to 3 seconds
}: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext()
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastContentRef = useRef<string>('')

  useEffect(() => {
    const saveDocument = async (content: string, force = false) => {
      try {
        // Only save if content has actually changed
        if (!force && content === lastContentRef.current) {
          return
        }

        lastContentRef.current = content

        // Notify UI that saving has begun
        try {
          window.dispatchEvent(
            new CustomEvent('editor:saving', {
              detail: { documentId, at: new Date() },
            })
          )
        } catch {}

        // Calculate stats
        const textContent = JSON.parse(content).root?.children
          ?.map((child: any) => child.children?.map((c: any) => c.text || '').join('') || '')
          .join('\n') || ''
        
        const words = textContent.trim() ? textContent.trim().split(/\s+/) : []
        const characterCount = textContent.length

        const updatedDocument: Partial<EditorDocument> = {
          content,
          wordCount: words.length,
          characterCount,
          updatedAt: new Date(),
        }

        // Save to IndexedDB
        if (force && content === lastContentRef.current) {
          // If forced and content hasn't changed since lastContentRef update above,
          // still update the updatedAt so user sees a save event and timestamp refresh.
          await db.documents.update(documentId, { updatedAt: new Date() })
        } else {
          await db.documents.update(documentId, updatedDocument)
        }
        
        // Notify parent component
        onSave(updatedDocument)
        
        // Notify listeners (e.g., UI save indicator)
        try {
          window.dispatchEvent(
            new CustomEvent('editor:saved', {
              detail: { documentId, at: new Date() },
            })
          )
        } catch {}
        console.log(`Document ${documentId} auto-saved at ${new Date().toLocaleTimeString()}`)
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }

    const scheduleAutoSave = (content: string) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Schedule new save
      saveTimeoutRef.current = setTimeout(() => {
        saveDocument(content)
      }, interval)
    }

    // Register update listener
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      const content = JSON.stringify(editorState.toJSON())
      scheduleAutoSave(content)
    })

    // Immediate save handler (e.g., Ctrl/Cmd+S)
    const handleSaveNow = () => {
      try {
        const content = JSON.stringify(editor.getEditorState().toJSON())
        // Run immediate save (no debounce)
        saveDocument(content, true)
      } catch (error) {
        console.error('Manual save failed:', error)
      }
    }

    window.addEventListener('editor:save-now', handleSaveNow)

    // Cleanup on unmount
    return () => {
      unregister()
      window.removeEventListener('editor:save-now', handleSaveNow)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [editor, documentId, onSave, interval])

  return null // This plugin doesn't render anything
}

/*
  AUTO-SAVE PLUGIN EXTENSION POINTS:
  
  1. SAVE INDICATORS:
     - Add visual indicators for save status (saving, saved, error)
     - Show last saved timestamp
     - Display save conflicts or errors
  
  2. BACKUP STRATEGIES:
     - Local storage fallback if IndexedDB fails
     - Cloud sync integration (Google Drive, Dropbox, etc.)
     - Version history with rollback capabilities
  
  3. CONFLICT RESOLUTION:
     - Handle concurrent editing conflicts
     - Merge strategies for simultaneous edits
     - Lock mechanism for collaborative editing
  
  4. PERFORMANCE OPTIMIZATIONS:
     - Debounced saves with smart batching
     - Delta compression for large documents
     - Background save queue with retry logic
  
  5. DATA INTEGRITY:
     - Checksum validation
     - Backup verification
     - Corruption detection and recovery
*/

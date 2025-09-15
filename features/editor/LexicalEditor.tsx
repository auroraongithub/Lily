"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type UIEventHandler, type Ref } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ImageNode } from './nodes/ImageNode'
import { $getRoot, EditorState, LexicalEditor as LexicalEditorType } from 'lexical'

import { cn } from '@/lib/utils'
import { EditorToolbar } from './components/EditorToolbar'
// import { EditorStats } from './components/EditorStats'
import { AutoSavePlugin } from './plugins/AutoSavePlugin'
import { KeyboardShortcutsPlugin } from './plugins/KeyboardShortcutsPlugin'
import { ImagePlugin } from './plugins/ImagePlugin'
import { SectionsPlugin } from './plugins/SectionsPlugin'
import { HighlightsPlugin } from './plugins/HighlightsPlugin'
import { ScrollToKeyPlugin } from './plugins/ScrollToKeyPlugin'
import { EntityMentionsPlugin } from './plugins/EntityMentionsPlugin'
import { EntityMentionsOverlayPlugin } from './plugins/EntityMentionsOverlayPlugin'
import type { SectionItem } from './plugins/SectionsPlugin'
import type { HighlightItem } from './plugins/HighlightsPlugin'
import type { EditorDocument, EditorStats as EditorStatsType } from './types'

interface LexicalEditorProps {
  document: EditorDocument
  onDocumentChange: (document: Partial<EditorDocument>) => void
  className?: string
  isLocked?: boolean
  // Optional: expose scroll container for sync scrolling
  scrollRef?: Ref<HTMLDivElement>
  onScroll?: UIEventHandler<HTMLDivElement>
  // Optional: hide stats bar (useful for split view secondary panes)
  showStats?: boolean
  // Optional: force scrollbar to be visible even if content does not overflow
  alwaysShowScrollbar?: boolean
}

// Placeholder component for empty editor
function Placeholder() {
  return (
    <div className="editor-placeholder pointer-events-none select-none text-muted-foreground">
      Start writing your story...
    </div>
  )
}

export function LexicalEditor({ document, onDocumentChange, className, isLocked = false, scrollRef, onScroll, showStats = true, alwaysShowScrollbar = false }: LexicalEditorProps) {
  const [stats, setStats] = useState<EditorStatsType>({
    wordCount: 0,
    characterCount: 0,
    characterCountNoSpaces: 0,
    paragraphCount: 0,
    readingTime: 0,
  })

  // Track container rect to limit the fixed stats bar within the editor pane only
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [barRect, setBarRect] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const updateBarRect = useCallback(() => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    setBarRect({ left: Math.round(r.left), width: Math.round(r.width) })
  }, [])
  useEffect(() => {
    updateBarRect()
    const onResize = () => updateBarRect()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    let ro: ResizeObserver | null = null
    if ('ResizeObserver' in window && containerRef.current) {
      ro = new ResizeObserver(() => updateBarRect())
      ro.observe(containerRef.current)
    }
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
      if (ro) ro.disconnect()
    }
  }, [updateBarRect])

  // Save status indicator
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  useEffect(() => {
    const onSaving = () => {
      setSaveStatus('saving')
    }
    const onSaved = (e: Event) => {
      setSaveStatus('saved')
      const at = (e as CustomEvent).detail?.at ? new Date((e as CustomEvent).detail.at) : new Date()
      setLastSavedAt(at)
      // fade back to idle after a short delay
      const t = setTimeout(() => setSaveStatus('idle'), 1500)
      return () => clearTimeout(t)
    }
    window.addEventListener('editor:saving' as any, onSaving)
    window.addEventListener('editor:saved' as any, onSaved as any)
    return () => {
      window.removeEventListener('editor:saving' as any, onSaving)
      window.removeEventListener('editor:saved' as any, onSaved as any)
    }
  }, [])

  // Navigator panel state
  const [showNavigator, setShowNavigator] = useState(false)
  const toggleNavigator = useCallback(() => setShowNavigator((v) => !v), [])

  // Sections & Highlights data
  const [sections, setSections] = useState<SectionItem[]>([])
  const [highlights, setHighlights] = useState<HighlightItem[]>([])
  const scrollToKey = useCallback((key: string) => {
    window.dispatchEvent(new CustomEvent('lily:editor:scrollToKey', { detail: { key } }))
  }, [])

  // Lexical editor configuration
  const initialConfig = useMemo(() => ({
    namespace: 'lily-editor',
    theme: {
      // Theme configuration for styling nodes
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        code: 'font-mono bg-muted px-1 rounded text-sm',
      },
      heading: {
        h1: 'text-3xl font-bold mb-4 mt-6',
        h2: 'text-2xl font-semibold mb-3 mt-5',
        h3: 'text-xl font-semibold mb-2 mt-4',
        h4: 'text-lg font-semibold mb-2 mt-3',
        h5: 'text-base font-semibold mb-1 mt-2',
        h6: 'text-sm font-semibold mb-1 mt-2',
      },
      paragraph: 'mb-2 leading-relaxed',
      quote: 'border-l-4 border-muted pl-4 italic text-muted-foreground my-4',
    },
    nodes: [HeadingNode, QuoteNode, ImageNode],
    editorState: document.content || undefined,
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error)
    },
  }), [document.content])

  // Handle editor state changes
  const onChange = useCallback((editorState: EditorState, editor: LexicalEditorType) => {
    editor.update(() => {
      const root = $getRoot()
      const textContent = root.getTextContent()
      
      // Calculate statistics
      const words = textContent.trim() ? textContent.trim().split(/\s+/) : []
      const paragraphs = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 0)
      const readingTime = Math.ceil(words.length / 200) // Average 200 words per minute
      
      const newStats: EditorStatsType = {
        wordCount: words.length,
        characterCount: textContent.length,
        characterCountNoSpaces: textContent.replace(/\s/g, '').length,
        paragraphCount: paragraphs.length,
        readingTime,
      }
      
      setStats(newStats)
      
      // Update document with new content and stats
      onDocumentChange({
        content: JSON.stringify(editorState.toJSON()),
        wordCount: newStats.wordCount,
        characterCount: newStats.characterCount,
        updatedAt: new Date(),
      })
    })
  }, [onDocumentChange])

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full min-h-0 relative', className)}>
      <LexicalComposer initialConfig={initialConfig}>
        {/* Scrollable editor content area */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className={cn(
            'flex-1 min-h-0 max-h-full transition-all duration-300',
            alwaysShowScrollbar ? 'overflow-y-scroll' : 'overflow-y-auto',
            isLocked && 'blur-sm opacity-30 pointer-events-none'
          )}
        >
          {/* Toolbar - sticky within the editor scroll area */}
          <div className="sticky top-0 z-20 bg-background -mt-px relative">
            <EditorToolbar 
              onFontPresetChange={(preset) => {
                onDocumentChange({ fontPreset: preset })
              }}
              showNavigator={showNavigator}
              onToggleNavigator={toggleNavigator}
            />
            {/* Save indicator */}
            <div className="absolute right-2 top-1 text-xs text-muted-foreground select-none">
              {saveStatus === 'saving' && <span>Saving…</span>}
              {saveStatus === 'saved' && (
                <span>
                  Saved{lastSavedAt ? ` at ${lastSavedAt.toLocaleTimeString()}` : ''}
                </span>
              )}
            </div>
          </div>
          <div className="relative lexical-editor">
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  className={cn(
                    'min-h-[600px] p-8 pb-4 focus:outline-none',
                    'prose prose-lg max-w-none',
                    'caret-foreground selection:bg-accent selection:text-accent-foreground',
                    'editor-content',
                    // Smooth caret and animations
                    'transition-all duration-200 ease-out',
                  )}
                  style={{
                    // Apply font preset styles
                    fontFamily: getFontFamily(document.fontPreset || 'serif'),
                  }}
                />
              }
              placeholder={<Placeholder />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            
            {/* Plugins */}
            <HistoryPlugin />
            <OnChangePlugin onChange={onChange} />
            <AutoFocusPlugin />
            <AutoSavePlugin 
              documentId={document.id}
              onSave={onDocumentChange}
            />
            <KeyboardShortcutsPlugin />
            <ImagePlugin />
            <SectionsPlugin onSectionsChange={setSections} />
            <HighlightsPlugin onHighlightsChange={setHighlights} />
            <ScrollToKeyPlugin />
            {/* Codex mentions highlighting */}
            <EntityMentionsPlugin documentId={document.id} />
            {/* Overlay fallback (non-destructive, theme-proof) */}
            <EntityMentionsOverlayPlugin documentId={document.id} opacity={0.28} />
          </div>

          {/* Stats bar - fixed at bottom of viewport (single instance per page). */}
          {showStats && (
            <div className="fixed bottom-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-1 editor-stats-bar pointer-events-none"
              style={{ left: barRect.left, width: barRect.width }}
            >
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>{stats.wordCount} words</span>
                <span>{stats.characterCount} characters</span>
                <span>{stats.paragraphCount} paragraphs</span>
                <span>{stats.readingTime} min read</span>
              </div>
            </div>
          )}

          {/* Navigator Panel: Sections & Highlights */}
          {showNavigator && (
            <div className="absolute top-12 right-2 bottom-2 w-64 bg-card rounded-md shadow-sm overflow-hidden">
              <div className="h-8 px-3 flex items-center justify-between bg-muted/40">
                <span className="text-xs font-medium text-muted-foreground">Navigator</span>
              </div>
              <div className="h-full overflow-y-auto">
                {/* Sections */}
                <div className="px-3 py-2">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Sections</div>
                  {sections.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No headings yet.</div>
                  ) : (
                    <ul className="space-y-1">
                      {sections.map((s) => (
                        <li key={s.key}>
                          <button
                            className={cn(
                              'w-full text-left text-xs px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground transition-colors',
                              s.tag === 'h1' && 'font-semibold',
                              s.tag === 'h2' && 'pl-1',
                              s.tag === 'h3' && 'pl-2',
                              (s.tag === 'h4' || s.tag === 'h5' || s.tag === 'h6') && 'pl-3'
                            )}
                            onClick={() => scrollToKey(s.key)}
                          >
                            {s.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="my-1" />
                {/* Highlights */}
                <div className="px-3 py-2">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Highlights</div>
                  {highlights.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No highlights.</div>
                  ) : (
                    <ul className="space-y-1">
                      {highlights.map((h) => (
                        <li key={h.key}>
                          <button
                            className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => scrollToKey(h.key)}
                            title={h.text}
                          >
                            {h.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </LexicalComposer>
    </div>
  )
}

// Helper function to get font family based on preset
function getFontFamily(preset: string): string {
  const fontPresets = {
    serif: 'ui-serif, Georgia, "Times New Roman", serif',
    sans: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, "Fira Code", "Cascadia Code", Consolas, monospace',
    handwriting: '"Kalam", "Comic Sans MS", cursive',
    custom: 'inherit', // Will be overridden by custom settings
  } as const
  
  return (fontPresets as any)[preset] || fontPresets.serif
}

/* 
  EXTENSIBILITY POINTS:
  
  1. TOOLBAR EXTENSIONS: Add new formatting tools in EditorToolbar component
     - Text color picker
     - Highlight color
     - Font size selector
     - Text alignment buttons
     - List controls (bullets, numbers)
     - Link insertion
     - Image upload
  
  2. PLUGIN EXTENSIONS: Add new plugins here
     - CollaborationPlugin for real-time editing
     - SpellCheckPlugin for grammar/spell checking
     - CitationPlugin for academic writing
     - VersionHistoryPlugin for document versioning
     - ExportPlugin for different formats (PDF, DOCX, etc.)
  
  3. NODE EXTENSIONS: Register new custom nodes in initialConfig.nodes
     - ImageNode for inline images
     - TableNode for data tables
     - CodeBlockNode for syntax highlighting
     - CalloutNode for highlighted sections
     - FootnoteNode for citations
  
  4. THEME EXTENSIONS: Extend theme object for custom styling
     - Custom heading styles
     - Code block themes
     - Color schemes
     - Typography presets
  
  5. STATISTICS EXTENSIONS: Add more metrics in onChange callback
     - Reading level analysis
     - Most used words
     - Document structure analysis
     - Progress tracking
*/

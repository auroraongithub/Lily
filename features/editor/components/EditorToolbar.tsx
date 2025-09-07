"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { 
  $getSelection, 
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  $createTextNode,
  TextNode
} from 'lexical'
import { $setBlocksType, $patchStyleText } from '@lexical/selection'
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text'
// History commands will use the HistoryPlugin's built-in keyboard shortcuts
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  ChevronDown,
  Image as ImageIcon
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { FontSizeSelector } from './FontSizeSelector'
import { TextColorPicker } from './TextColorPicker'
import { FontPresetSelector } from './FontPresetSelector'
import { cn } from '@/lib/utils'
import { INSERT_IMAGE_COMMAND } from '../plugins/ImagePlugin'

interface EditorToolbarProps {
  onFontPresetChange?: (preset: import('../types').FontPreset) => void
}

export function EditorToolbar({ onFontPresetChange }: EditorToolbarProps = {}) {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [blockType, setBlockType] = useState('paragraph')
  const [fontSize, setFontSize] = useState(16)
  const [textColor, setTextColor] = useState('#000000')
  const [textAlign, setTextAlign] = useState('left')
  const [fontPreset, setFontPreset] = useState<import('../types').FontPreset>('serif')
  // Compact mode: when toolbar width is tight (e.g., centered editor mode),
  // show dropdowns for Headings and Alignment to avoid horizontal scrolling.
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const [compact, setCompact] = useState(false)
  const [isHeadingOpen, setIsHeadingOpen] = useState(false)
  const [isAlignOpen, setIsAlignOpen] = useState(false)
  const [isFormatOpen, setIsFormatOpen] = useState(false)

  // Compact spacing helpers
  const buttonPad = compact ? 'px-1' : 'px-2'

  // Image upload input ref
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  // Update toolbar state based on current selection
  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
    }
  }, [])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar()
        return false
      },
      COMMAND_PRIORITY_LOW
    )
  }, [editor, updateToolbar])

  // Observe toolbar width to toggle compact mode responsively
  useEffect(() => {
    if (!toolbarRef.current) return
    const el = toolbarRef.current
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        // threshold picked to fit all controls in centered layout
        setCompact(w < 900)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Formatting commands
  const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize))
      }
    })
  }

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode())
      }
    })
  }

  const undo = () => {
    // Use browser's built-in undo - HistoryPlugin handles this automatically
    document.execCommand('undo')
  }

  const redo = () => {
    // Use browser's built-in redo - HistoryPlugin handles this automatically  
    document.execCommand('redo')
  }

  // Font size handling
  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node instanceof TextNode) {
            node.setStyle(`font-size: ${size}px`)
          }
        })
      }
    })
  }

  // Text color handling
  const handleTextColorChange = (color: string) => {
    setTextColor(color)
    editor.update(() => {
      const selection = $getSelection()
      // Only act when we have a range selection (either collapsed caret or text selected)
      if (!$isRangeSelection(selection)) return

      // Apply color using Lexical's style patching utility.
      // - If collapsed: sets the style for upcoming input at caret
      // - If text selected: updates the selected text color
      $patchStyleText(selection, { color })
    })
  }

  // Text alignment handling
  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    setTextAlign(alignment)
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment)
  }

  // Font preset handling
  const handleFontPresetChange = (preset: import('../types').FontPreset) => {
    setFontPreset(preset)
    onFontPresetChange?.(preset)
  }

  // Image handling
  const triggerImagePicker = () => {
    imageInputRef.current?.click()
  }

  const onImageFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
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
    // reset input to allow re-uploading same file
    e.target.value = ''
  }

  return (
    <div ref={toolbarRef} className="flex items-center gap-0 px-2 py-1 border-b bg-background">
      {/* Hidden image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onImageFilesSelected}
        className="hidden"
      />
      {/* Undo/Redo */}
      <div className="flex items-center gap-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          className={cn('h-8', buttonPad)}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          className={cn('h-8', buttonPad)}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-5 w-5" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border mx-0.5" />

      {/* Text Formatting */}
      {compact ? (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFormatOpen((v) => !v)}
            className={cn('h-8', buttonPad)}
            title="Formatting"
            aria-expanded={isFormatOpen}
          >
            <div className="flex items-center gap-1">
              <Bold className="h-5 w-5" />
              <ChevronDown className="h-3 w-3" />
            </div>
          </Button>
          {isFormatOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsFormatOpen(false)} />
              <div className="absolute top-full left-0 z-20 mt-1 w-40 bg-background border rounded-md shadow-md toolbar-dropdown">
                <button
                  className={`w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-accent hover:text-accent-foreground ${isBold ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => { formatText('bold'); setIsFormatOpen(false) }}
                >
                  <Bold className="h-4 w-4" /> Bold
                </button>
                <button
                  className={`w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-accent hover:text-accent-foreground ${isItalic ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => { formatText('italic'); setIsFormatOpen(false) }}
                >
                  <Italic className="h-4 w-4" /> Italic
                </button>
                <button
                  className={`w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-accent hover:text-accent-foreground ${isUnderline ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => { formatText('underline'); setIsFormatOpen(false) }}
                >
                  <Underline className="h-4 w-4" /> Underline
                </button>
                <button
                  className={`w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-accent hover:text-accent-foreground ${isStrikethrough ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => { formatText('strikethrough'); setIsFormatOpen(false) }}
                >
                  <Strikethrough className="h-4 w-4" /> Strikethrough
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-0.5">
          <Button
            variant={isBold ? "secondary" : "ghost"}
            size="sm"
            onClick={() => formatText('bold')}
            className="h-8 px-2"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-5 w-5" />
          </Button>
          <Button
            variant={isItalic ? "secondary" : "ghost"}
            size="sm"
            onClick={() => formatText('italic')}
            className="h-8 px-2"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-5 w-5" />
          </Button>
          <Button
            variant={isUnderline ? "secondary" : "ghost"}
            size="sm"
            onClick={() => formatText('underline')}
            className="h-8 px-2"
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-5 w-5" />
          </Button>
          <Button
            variant={isStrikethrough ? "secondary" : "ghost"}
            size="sm"
            onClick={() => formatText('strikethrough')}
            className="h-8 px-2"
            title="Strikethrough"
          >
            <Strikethrough className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="w-px h-6 bg-border mx-px" />

      {/* Headings and Quote */}
      {compact ? (
        <div className="relative mr-px">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsHeadingOpen((v) => !v)}
            className={cn('h-8', buttonPad)}
            title="Headings"
            aria-expanded={isHeadingOpen}
          >
            <div className="flex items-center gap-1">
              <Heading1 className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </div>
          </Button>
          {isHeadingOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsHeadingOpen(false)} />
              <div className="absolute top-full left-0 z-20 mt-1 w-28 bg-background border rounded-md shadow-md toolbar-dropdown">
                <button className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground" onClick={() => { formatHeading('h1'); setIsHeadingOpen(false) }}>H1</button>
                <button className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground" onClick={() => { formatHeading('h2'); setIsHeadingOpen(false) }}>H2</button>
                <button className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground" onClick={() => { formatHeading('h3'); setIsHeadingOpen(false) }}>H3</button>
                <div className="border-t my-1" />
                <button className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground" onClick={() => { formatQuote(); setIsHeadingOpen(false) }}>Quote</button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatHeading('h1')}
            className="h-8 px-2"
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatHeading('h2')}
            className="h-8 px-2"
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatHeading('h3')}
            className="h-8 px-2"
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={formatQuote}
            className="h-8 px-2"
            title="Quote"
          >
            <Quote className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="w-px h-6 bg-border mx-px" />

      {/* Font Preset */}
      <div className="flex items-center gap-0.5">
        <FontPresetSelector
          currentPreset={fontPreset}
          onPresetChange={handleFontPresetChange}
        />
      </div>

      <div className="w-px h-6 bg-border mx-0.5" />

      {/* Insert Image */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerImagePicker}
          className={cn('h-8', buttonPad)}
          title="Insert Image"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border mx-0.5" />

      {/* Font Size */}
      <div className="flex items-center gap-0.5">
        <FontSizeSelector
          currentSize={fontSize}
          onSizeChange={handleFontSizeChange}
        />
      </div>

      <div className="w-px h-6 bg-border mx-0.5" />

      {/* Text Color */}
      <div className="flex items-center gap-0.5">
        <TextColorPicker
          currentColor={textColor}
          onColorChange={handleTextColorChange}
        />
      </div>

      <div className="w-px h-6 bg-border mx-0.5" />

      {/* Alignment */}
      {compact ? (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAlignOpen((v) => !v)}
            className={cn('h-8', buttonPad)}
            title="Alignment"
            aria-expanded={isAlignOpen}
          >
            <div className="flex items-center gap-1">
              {textAlign === 'center' ? (
                <AlignCenter className="h-5 w-5" />
              ) : textAlign === 'right' ? (
                <AlignRight className="h-5 w-5" />
              ) : textAlign === 'justify' ? (
                <AlignJustify className="h-5 w-5" />
              ) : (
                <AlignLeft className="h-5 w-5" />
              )}
              <ChevronDown className="h-3 w-3" />
            </div>
          </Button>
          {isAlignOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsAlignOpen(false)} />
              <div className="absolute top-full left-0 z-20 mt-1 w-36 bg-background border rounded-md shadow-md toolbar-dropdown">
                <button className="w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-accent hover:text-accent-foreground" onClick={() => { handleAlignmentChange('left'); setIsAlignOpen(false) }}><AlignLeft className="h-4 w-4" /> Left</button>
                <button className="w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-accent hover:text-accent-foreground" onClick={() => { handleAlignmentChange('center'); setIsAlignOpen(false) }}><AlignCenter className="h-4 w-4" /> Center</button>
                <button className="w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-accent hover:text-accent-foreground" onClick={() => { handleAlignmentChange('right'); setIsAlignOpen(false) }}><AlignRight className="h-4 w-4" /> Right</button>
                <button className="w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-accent hover:text-accent-foreground" onClick={() => { handleAlignmentChange('justify'); setIsAlignOpen(false) }}><AlignJustify className="h-4 w-4" /> Justify</button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-0.5">
          <Button
            variant={textAlign === 'left' ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2"
            onClick={() => handleAlignmentChange('left')}
            title="Align Left"
          >
            <AlignLeft className="h-5 w-5" />
          </Button>
          <Button
            variant={textAlign === 'center' ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2"
            onClick={() => handleAlignmentChange('center')}
            title="Align Center"
          >
            <AlignCenter className="h-5 w-5" />
          </Button>
          <Button
            variant={textAlign === 'right' ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2"
            onClick={() => handleAlignmentChange('right')}
            title="Align Right"
          >
            <AlignRight className="h-5 w-5" />
          </Button>
          <Button
            variant={textAlign === 'justify' ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2"
            onClick={() => handleAlignmentChange('justify')}
            title="Justify"
          >
            <AlignJustify className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}

/*
  TOOLBAR EXTENSION POINTS:
  
  1. FONT SIZE DROPDOWN:
     - Replace disabled button with actual dropdown
     - Use @radix-ui/react-dropdown-menu or similar
     - Implement FORMAT_TEXT_COMMAND with fontSize
  
  2. TEXT COLOR PICKER:
     - Add color picker component (e.g., react-colorful)
     - Implement custom text color formatting
     - Create TextColorNode if needed for advanced coloring
  
  3. TEXT ALIGNMENT:
     - Implement element-based alignment commands
     - Use FORMAT_ELEMENT_COMMAND with textAlign values
     - Add alignment state tracking
  
  4. ADDITIONAL FORMATTING:
     - Lists (ordered/unordered)
     - Links and link editing
     - Code blocks with syntax highlighting
     - Tables
     - Images and media
  
  5. FONT FAMILY SELECTOR:
     - Add dropdown for font presets
     - Custom font family input
     - Google Fonts integration
  
  6. ADVANCED FEATURES:
     - Find and replace
     - Document outline/navigation
     - Comments and suggestions
     - Export options
*/

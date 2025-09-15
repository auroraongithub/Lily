"use client"

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Upload, FileText, File, Code, X, ChevronDown, ChevronRight } from 'lucide-react'

interface ImportModalProps {
  projectId: string
  onClose: () => void
  onImport: (result: ImportResult) => void
}

interface ImportResult {
  chapters: Array<{
    title: string
    content: string
    index: number
  }>
  metadata?: {
    title?: string
    author?: string
    description?: string
  }
}

interface ParsedChapter {
  title: string
  content: string
  originalIndex: number
  selected: boolean
  newTitle?: string
}

type ImportFormat = 'markdown' | 'docx' | 'html'

export function ImportModal({ projectId, onClose, onImport }: ImportModalProps) {
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [parsing, setParsing] = useState(false)
  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([])
  const [importOptions, setImportOptions] = useState({
    chapterSplitLevel: 1, // H1=1, H2=2, etc for Markdown
    mergeConsecutive: false,
    preserveFormatting: true
  })
  const [expandedPreview, setExpandedPreview] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.name.endsWith('.md') || 
      file.name.endsWith('.markdown') ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.html') ||
      file.name.endsWith('.htm')
    )
    setFiles(droppedFiles)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
  }

  const detectFormat = (file: File): ImportFormat => {
    const ext = file.name.toLowerCase()
    if (ext.endsWith('.md') || ext.endsWith('.markdown')) return 'markdown'
    if (ext.endsWith('.docx')) return 'docx'
    if (ext.endsWith('.html') || ext.endsWith('.htm')) return 'html'
    return 'markdown' // fallback
  }

  const parseMarkdown = (content: string): ParsedChapter[] => {
    const lines = content.split('\n')
    const chapters: ParsedChapter[] = []
    let currentChapter: { title: string; content: string[] } | null = null
    let chapterIndex = 0

    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headerMatch) {
        const level = headerMatch[1].length
        const title = headerMatch[2].trim()
        
        if (level <= importOptions.chapterSplitLevel) {
          // Start new chapter
          if (currentChapter) {
            chapters.push({
              title: currentChapter.title,
              content: currentChapter.content.join('\n').trim(),
              originalIndex: chapterIndex++,
              selected: true
            })
          }
          currentChapter = { title, content: [line] }
        } else if (currentChapter) {
          currentChapter.content.push(line)
        }
      } else if (currentChapter) {
        currentChapter.content.push(line)
      } else {
        // Content before any headers - create "Introduction" chapter
        if (!currentChapter && line.trim()) {
          currentChapter = { title: 'Introduction', content: [line] }
        }
      }
    }

    // Add final chapter
    if (currentChapter) {
      chapters.push({
        title: currentChapter.title,
        content: currentChapter.content.join('\n').trim(),
        originalIndex: chapterIndex,
        selected: true
      })
    }

    return chapters
  }

  const parseHTML = (content: string): ParsedChapter[] => {
    // Basic HTML parsing - extract h1-h6 as chapter breaks
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const chapters: ParsedChapter[] = []
    let chapterIndex = 0
    
    const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const levelMap = { H1: 1, H2: 2, H3: 3, H4: 4, H5: 5, H6: 6 }
    
    headers.forEach((header, i) => {
      const level = levelMap[header.tagName as keyof typeof levelMap]
      if (level <= importOptions.chapterSplitLevel) {
        // Find content until next header of same or higher level
        let content = ''
        let current = header.nextElementSibling
        const nextHeaderSelector = Array.from({ length: level }, (_, i) => `h${i + 1}`).join(', ')
        
        while (current && !current.matches(nextHeaderSelector)) {
          content += current.outerHTML + '\n'
          current = current.nextElementSibling
        }
        
        chapters.push({
          title: header.textContent?.trim() || `Chapter ${chapterIndex + 1}`,
          content: content.trim(),
          originalIndex: chapterIndex++,
          selected: true
        })
      }
    })
    
    return chapters.length > 0 ? chapters : [{
      title: 'Imported Content',
      content: doc.body.innerHTML,
      originalIndex: 0,
      selected: true
    }]
  }

  const parseDOCX = async (file: File): Promise<ParsedChapter[]> => {
    // For now, treat as plain text - would need mammoth.js or similar for proper DOCX parsing
    const text = await file.text()
    return [{
      title: file.name.replace(/\.[^/.]+$/, ""),
      content: text,
      originalIndex: 0,
      selected: true
    }]
  }

  const handleParse = async () => {
    if (files.length === 0) return
    
    setParsing(true)
    const allChapters: ParsedChapter[] = []
    
    try {
      for (const file of files) {
        const format = detectFormat(file)
        const content = await file.text()
        
        let chapters: ParsedChapter[] = []
        if (format === 'markdown') {
          chapters = parseMarkdown(content)
        } else if (format === 'html') {
          chapters = parseHTML(content)
        } else if (format === 'docx') {
          chapters = await parseDOCX(file)
        }
        
        allChapters.push(...chapters)
      }
      
      setParsedChapters(allChapters)
    } catch (error) {
      console.error('Parse error:', error)
    } finally {
      setParsing(false)
    }
  }

  const handleImportConfirm = () => {
    const selectedChapters = parsedChapters
      .filter(ch => ch.selected)
      .map((ch, index) => ({
        title: ch.newTitle || ch.title,
        content: ch.content,
        index
      }))
    
    onImport({ chapters: selectedChapters })
  }

  const toggleChapterSelection = (index: number) => {
    setParsedChapters(prev => 
      prev.map((ch, i) => 
        i === index ? { ...ch, selected: !ch.selected } : ch
      )
    )
  }

  const updateChapterTitle = (index: number, title: string) => {
    setParsedChapters(prev => 
      prev.map((ch, i) => 
        i === index ? { ...ch, newTitle: title } : ch
      )
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Import Novel</h2>
              <p className="text-sm text-muted-foreground">Import from Markdown, HTML, or DOCX files</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {parsedChapters.length === 0 ? (
            <div className="space-y-6">
              {/* File Upload */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports .md, .markdown, .html, .docx files
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".md,.markdown,.html,.htm,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Selected Files ({files.length})</h3>
                  <div className="space-y-2">
                    {files.map((file, i) => {
                      const format = detectFormat(file)
                      const Icon = format === 'markdown' ? FileText : format === 'html' ? Code : File
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                          <Icon className="h-4 w-4" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground uppercase">{format}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Import Options */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium">Import Options</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Chapter Split Level</label>
                        <select 
                          className="w-full mt-1 h-9 px-3 border rounded bg-background"
                          value={importOptions.chapterSplitLevel}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, chapterSplitLevel: parseInt(e.target.value) }))}
                        >
                          <option value={1}>H1 Headers</option>
                          <option value={2}>H1 & H2 Headers</option>
                          <option value={3}>H1, H2 & H3 Headers</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="preserve-format"
                          checked={importOptions.preserveFormatting}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, preserveFormatting: e.target.checked }))}
                        />
                        <label htmlFor="preserve-format" className="text-sm">Preserve formatting</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleParse} disabled={parsing}>
                      {parsing ? 'Parsing...' : 'Parse Files'}
                    </Button>
                    <Button variant="outline" onClick={() => setFiles([])}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Preview Chapters ({parsedChapters.length})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setParsedChapters(prev => prev.map(ch => ({ ...ch, selected: true })))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setParsedChapters(prev => prev.map(ch => ({ ...ch, selected: false })))}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {parsedChapters.map((chapter, index) => (
                  <div key={index} className={`border rounded p-3 ${chapter.selected ? 'bg-primary/5' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={chapter.selected}
                        onChange={() => toggleChapterSelection(index)}
                      />
                      <Input
                        value={chapter.newTitle || chapter.title}
                        onChange={(e) => updateChapterTitle(index, e.target.value)}
                        className="flex-1"
                        placeholder="Chapter title"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedPreview(expandedPreview === index ? null : index)}
                      >
                        {expandedPreview === index ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </div>
                    {expandedPreview === index && (
                      <div className="mt-3 p-3 bg-background rounded text-sm">
                        <pre className="whitespace-pre-wrap text-xs max-h-32 overflow-y-auto">
                          {chapter.content.substring(0, 500)}
                          {chapter.content.length > 500 && '...'}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={handleImportConfirm}
                  disabled={!parsedChapters.some(ch => ch.selected)}
                >
                  Import {parsedChapters.filter(ch => ch.selected).length} Chapters
                </Button>
                <Button variant="outline" onClick={() => setParsedChapters([])}>
                  Back to Upload
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

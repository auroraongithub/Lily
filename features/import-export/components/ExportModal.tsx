"use client"

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Download, FileText, File, BookOpen, X, Check } from 'lucide-react'
import type { Project, Volume, Chapter } from '@/lib/types'

interface ExportModalProps {
  project: Project
  volumes: Volume[]
  chapters: Chapter[]
  onClose: () => void
  onExport: (options: ExportOptions) => void
}

interface ExportOptions {
  format: 'markdown' | 'docx' | 'epub' | 'pdf'
  includeMetadata: boolean
  includeFrontMatter: boolean
  selectedChapters: string[]
  outputName: string
  markdownOptions?: {
    headerLevel: number
    includeWordCount: boolean
  }
  docxOptions?: {
    fontSize: number
    fontFamily: string
    pageSize: 'A4' | 'Letter'
  }
  epubOptions?: {
    coverImage?: string
    isbn?: string
  }
  pdfOptions?: {
    fontSize: number
    fontFamily: string
    pageSize: 'A4' | 'Letter'
    margins: number
  }
}

type ExportFormat = 'markdown' | 'docx' | 'epub' | 'pdf'

export function ExportModal({ project, volumes, chapters, onClose, onExport }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown')
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set(chapters.map(c => c.id)))
  const [outputName, setOutputName] = useState(project.title || 'Novel Export')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeFrontMatter, setIncludeFrontMatter] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Format-specific options
  const [markdownOptions, setMarkdownOptions] = useState({
    headerLevel: 1,
    includeWordCount: true
  })

  const [docxOptions, setDocxOptions] = useState({
    fontSize: 12,
    fontFamily: 'Times New Roman',
    pageSize: 'A4' as const
  })

  const [epubOptions, setEpubOptions] = useState({
    isbn: '',
    coverImage: ''
  })

  const [pdfOptions, setPdfOptions] = useState({
    fontSize: 12,
    fontFamily: 'Times New Roman',
    pageSize: 'A4' as const,
    margins: 1
  })

  const formatInfo = {
    markdown: {
      icon: FileText,
      title: 'Markdown',
      description: 'Plain text with formatting markup',
      extension: '.md'
    },
    docx: {
      icon: File,
      title: 'Microsoft Word',
      description: 'Rich formatted document',
      extension: '.docx'
    },
    epub: {
      icon: BookOpen,
      title: 'EPUB',
      description: 'Standard ebook format',
      extension: '.epub'
    },
    pdf: {
      icon: File,
      title: 'PDF',
      description: 'Portable document format',
      extension: '.pdf'
    }
  }

  const selectedChaptersList = useMemo(() => {
    return chapters.filter(c => selectedChapters.has(c.id)).sort((a, b) => a.index - b.index)
  }, [chapters, selectedChapters])

  const totalWords = useMemo(() => {
    return selectedChaptersList.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0)
  }, [selectedChaptersList])

  const handleChapterToggle = (chapterId: string) => {
    setSelectedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapterId)) {
        next.delete(chapterId)
      } else {
        next.add(chapterId)
      }
      return next
    })
  }

  const handleExport = async () => {
    setExporting(true)
    
    const options: ExportOptions = {
      format: selectedFormat,
      includeMetadata,
      includeFrontMatter,
      selectedChapters: Array.from(selectedChapters),
      outputName,
      ...(selectedFormat === 'markdown' && { markdownOptions }),
      ...(selectedFormat === 'docx' && { docxOptions }),
      ...(selectedFormat === 'epub' && { epubOptions }),
      ...(selectedFormat === 'pdf' && { pdfOptions })
    }
    
    try {
      await onExport(options)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Export Novel</h2>
              <p className="text-sm text-muted-foreground">Export your project in various formats</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto space-y-6">
          {/* Format Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Export Format</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(formatInfo).map(([format, info]) => {
                const Icon = info.icon
                const isSelected = selectedFormat === format
                return (
                  <div
                    key={format}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedFormat(format as ExportFormat)}
                  >
                    <Icon className="h-8 w-8 mb-2" />
                    <div className="text-sm font-medium">{info.title}</div>
                    <div className="text-xs text-muted-foreground">{info.description}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="font-medium">Export Options</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Output Filename</label>
                <Input
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                  placeholder="Enter filename"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be saved as: {outputName}{formatInfo[selectedFormat].extension}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                  />
                  <span className="text-sm">Include project metadata</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeFrontMatter}
                    onChange={(e) => setIncludeFrontMatter(e.target.checked)}
                  />
                  <span className="text-sm">Include chapter front matter</span>
                </label>
              </div>
            </div>
          </div>

          {/* Format-specific Options */}
          {selectedFormat === 'markdown' && (
            <div className="space-y-4">
              <h3 className="font-medium">Markdown Options</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Chapter Header Level</label>
                  <select
                    className="w-full mt-1 h-9 px-3 border rounded bg-background"
                    value={markdownOptions.headerLevel}
                    onChange={(e) => setMarkdownOptions(prev => ({ ...prev, headerLevel: parseInt(e.target.value) }))}
                  >
                    <option value={1}># H1</option>
                    <option value={2}>## H2</option>
                    <option value={3}>### H3</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={markdownOptions.includeWordCount}
                      onChange={(e) => setMarkdownOptions(prev => ({ ...prev, includeWordCount: e.target.checked }))}
                    />
                    <span className="text-sm">Include word counts</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {(selectedFormat === 'docx' || selectedFormat === 'pdf') && (
            <div className="space-y-4">
              <h3 className="font-medium">{selectedFormat.toUpperCase()} Options</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Font Family</label>
                  <select
                    className="w-full mt-1 h-9 px-3 border rounded bg-background"
                    value={selectedFormat === 'docx' ? docxOptions.fontFamily : pdfOptions.fontFamily}
                    onChange={(e) => {
                      if (selectedFormat === 'docx') {
                        setDocxOptions(prev => ({ ...prev, fontFamily: e.target.value }))
                      } else {
                        setPdfOptions(prev => ({ ...prev, fontFamily: e.target.value }))
                      }
                    }}
                  >
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Calibri">Calibri</option>
                    <option value="Georgia">Georgia</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Font Size</label>
                  <Input
                    type="number"
                    min="8"
                    max="24"
                    value={selectedFormat === 'docx' ? docxOptions.fontSize : pdfOptions.fontSize}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      if (selectedFormat === 'docx') {
                        setDocxOptions(prev => ({ ...prev, fontSize: value }))
                      } else {
                        setPdfOptions(prev => ({ ...prev, fontSize: value }))
                      }
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Page Size</label>
                  <select
                    className="w-full mt-1 h-9 px-3 border rounded bg-background"
                    value={selectedFormat === 'docx' ? docxOptions.pageSize : pdfOptions.pageSize}
                    onChange={(e) => {
                      const value = e.target.value as 'A4' | 'Letter'
                      if (selectedFormat === 'docx') {
                        setDocxOptions(prev => ({ ...prev, pageSize: value }))
                      } else {
                        setPdfOptions(prev => ({ ...prev, pageSize: value }))
                      }
                    }}
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">US Letter</option>
                  </select>
                </div>
              </div>
              {selectedFormat === 'pdf' && (
                <div>
                  <label className="text-sm font-medium">Margins (inches)</label>
                  <Input
                    type="number"
                    min="0.5"
                    max="2"
                    step="0.25"
                    value={pdfOptions.margins}
                    onChange={(e) => setPdfOptions(prev => ({ ...prev, margins: parseFloat(e.target.value) }))}
                    className="mt-1 w-32"
                  />
                </div>
              )}
            </div>
          )}

          {selectedFormat === 'epub' && (
            <div className="space-y-4">
              <h3 className="font-medium">EPUB Options</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">ISBN (optional)</label>
                  <Input
                    value={epubOptions.isbn}
                    onChange={(e) => setEpubOptions(prev => ({ ...prev, isbn: e.target.value }))}
                    placeholder="978-0-000000-00-0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cover Image (optional)</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setEpubOptions(prev => ({ ...prev, coverImage: file.name }))
                      }
                    }}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Chapter Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Chapters to Export</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedChapters(new Set(chapters.map(c => c.id)))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedChapters(new Set())}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {chapters.map(chapter => {
                const isSelected = selectedChapters.has(chapter.id)
                return (
                  <div
                    key={chapter.id}
                    className={`flex items-center gap-3 p-3 border rounded cursor-pointer ${
                      isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleChapterToggle(chapter.id)}
                  >
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <div className="h-4 w-4 border rounded" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{chapter.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {chapter.wordCount || 0} words
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="text-sm text-muted-foreground">
              Selected: {selectedChaptersList.length} chapters, {totalWords.toLocaleString()} words
            </div>
          </div>

          {/* Export Button */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={handleExport}
              disabled={selectedChapters.size === 0 || exporting || !outputName.trim()}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : `Export ${formatInfo[selectedFormat].title}`}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

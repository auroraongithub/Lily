import { useState } from 'react'
import { db } from '@/lib/db'
import type { Project, Chapter, EditorDocument } from '@/lib/types'
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical'

interface ImportOptions {
  projectId: string
  chapters: Array<{
    title: string
    content: string
    index: number
  }>
  metadata?: {
    name?: string
    author?: string
    description?: string
  }
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

export function useImportExport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const importChapters = async (options: ImportOptions): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { projectId, chapters, metadata } = options

      // Update project metadata if provided
      if (metadata) {
        const project = await db.projects.get(projectId)
        if (project) {
          await db.projects.update(projectId, {
            name: metadata.name || project.name,
            description: metadata.description || project.description
          })
        }
      }

      // Get current highest chapter index
      const existingChapters = await db.chapters.where('projectId').equals(projectId).toArray()
      const maxIndex = existingChapters.length > 0 ? Math.max(...existingChapters.map(c => c.index)) : -1

      // Import chapters
      for (const [i, chapterData] of chapters.entries()) {
        const chapterId = crypto.randomUUID()
        const documentId = crypto.randomUUID()
        const now = new Date().toISOString()

        // Convert content to Lexical format
        const lexicalContent = await convertToLexical(chapterData.content)

        // Create document
        await db.documents.add({
          id: documentId,
          content: lexicalContent,
          createdAt: now,
          updatedAt: now,
          wordCount: countWords(chapterData.content)
        })

        // Create chapter
        await db.chapters.add({
          id: chapterId,
          projectId,
          title: chapterData.title,
          index: maxIndex + i + 1,
          documentId,
          wordCount: countWords(chapterData.content),
          createdAt: now,
          updatedAt: now
        })
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  const exportProject = async (project: Project, chapters: Chapter[], options: ExportOptions): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const { format, selectedChapters, outputName } = options

      // Filter selected chapters and sort by index
      const chaptersToExport = chapters
        .filter(c => selectedChapters.includes(c.id))
        .sort((a, b) => a.index - b.index)

      // Get chapter documents
      const documents = await Promise.all(
        chaptersToExport.map(async (chapter) => {
          const doc = chapter.documentId ? await db.documents.get(chapter.documentId) : null
          return { chapter, document: doc || null }
        })
      )

      let content: string | Blob
      let filename: string
      let mimeType: string

      switch (format) {
        case 'markdown':
          content = await exportMarkdown(project, documents, options)
          filename = `${outputName}.md`
          mimeType = 'text/markdown'
          break
        case 'docx':
          content = await exportDocx(project, documents, options)
          filename = `${outputName}.docx`
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          break
        case 'epub':
          content = await exportEpub(project, documents, options)
          filename = `${outputName}.epub`
          mimeType = 'application/epub+zip'
          break
        case 'pdf':
          content = await exportPdf(project, documents, options)
          filename = `${outputName}.pdf`
          mimeType = 'application/pdf'
          break
        default:
          throw new Error(`Unsupported format: ${format}`)
      }

      // Download the file
      downloadFile(content, filename, mimeType)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    importChapters,
    exportProject
  }
}

async function convertToLexical(content: string): Promise<string> {
  // Simple conversion - create basic Lexical structure
  const paragraphs = content.split('\n\n').filter(p => p.trim())
  
  const lexicalState = {
    root: {
      children: paragraphs.map(paragraph => ({
        children: [{
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: paragraph.trim(),
          type: 'text',
          version: 1
        }],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  }

  return JSON.stringify(lexicalState)
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

async function exportMarkdown(
  project: Project, 
  documents: Array<{ chapter: Chapter; document: EditorDocument | null }>,
  options: ExportOptions
): Promise<string> {
  const { includeMetadata, includeFrontMatter, markdownOptions } = options
  const headerPrefix = '#'.repeat(markdownOptions?.headerLevel || 1)
  
  let content = ''

  // Add metadata header
  if (includeMetadata) {
    content += '---\n'
    content += `title: "${project.name}"\n`
    if (project.description) content += `description: "${project.description}"\n`
    content += `exported: ${new Date().toISOString()}\n`
    content += '---\n\n'
    
    content += `${headerPrefix} ${project.name}\n\n`
    if (project.description) {
      content += `${project.description}\n\n`
    }
  }

  // Add chapters
  for (const { chapter, document } of documents) {
    if (includeFrontMatter) {
      content += '---\n'
      content += `chapter: "${chapter.title}"\n`
      content += `index: ${chapter.index}\n`
      if (markdownOptions?.includeWordCount && chapter.wordCount) {
        content += `words: ${chapter.wordCount}\n`
      }
      content += '---\n\n'
    }

    content += `${headerPrefix} ${chapter.title}\n\n`
    
    if (document?.content) {
      const plainText = await extractTextFromLexical(document.content)
      content += plainText + '\n\n'
    }
  }

  return content
}

async function exportDocx(
  project: Project,
  documents: Array<{ chapter: Chapter; document: EditorDocument | null }>,
  options: ExportOptions
): Promise<Blob> {
  // For now, create a simple text file that could be opened in Word
  // In a real implementation, you'd use a library like docx or mammoth
  const markdownContent = await exportMarkdown(project, documents, options)
  return new Blob([markdownContent], { type: 'text/plain' })
}

async function exportEpub(
  project: Project,
  documents: Array<{ chapter: Chapter; document: EditorDocument | null }>,
  options: ExportOptions
): Promise<Blob> {
  // Basic EPUB structure - in practice you'd use a proper EPUB library
  const content = await exportMarkdown(project, documents, options)
  return new Blob([content], { type: 'text/plain' })
}

async function exportPdf(
  project: Project,
  documents: Array<{ chapter: Chapter; document: EditorDocument | null }>,
  options: ExportOptions
): Promise<Blob> {
  // For PDF generation, you'd typically use a library like jsPDF or Puppeteer
  const content = await exportMarkdown(project, documents, options)
  return new Blob([content], { type: 'text/plain' })
}

async function extractTextFromLexical(lexicalContent: string): Promise<string> {
  try {
    const editorState = JSON.parse(lexicalContent)
    
    function extractTextFromNode(node: any): string {
      if (node.type === 'text') {
        return node.text || ''
      }
      
      if (node.children) {
        return node.children.map(extractTextFromNode).join('')
      }
      
      return ''
    }
    
    if (editorState.root && editorState.root.children) {
      return editorState.root.children
        .map(extractTextFromNode)
        .join('\n\n')
    }
    
    return ''
  } catch (error) {
    console.error('Failed to extract text from Lexical content:', error)
    return ''
  }
}

function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

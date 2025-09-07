import { useState } from 'react'
import { db } from '@/lib/db'
import type { Project, Volume, Chapter } from '@/lib/types'

export type ExportFormat = 'pdf' | 'epub' | 'txt' | 'docx'

interface ExportOptions {
  includeMetadata: boolean
  includeTOC: boolean
  chapterSeparation: 'page-break' | 'line-break' | 'section'
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const exportVolume = async (
    volumeId: string,
    format: ExportFormat,
    options: ExportOptions = {
      includeMetadata: true,
      includeTOC: true,
      chapterSeparation: 'page-break'
    }
  ) => {
    setIsExporting(true)
    setExportProgress(0)
    setError(null)

    try {
      // Get volume and its chapters
      const volume = await db.volumes.get(volumeId)
      if (!volume) throw new Error('Volume not found')

      const chapters = await db.chapters
        .where('volumeId')
        .equals(volumeId)
        .sortBy('index')

      setExportProgress(25)

      // Get project info for metadata
      const project = await db.projects.get(volume.projectId)

      setExportProgress(50)

      // Build content
      let content = ''
      
      if (options.includeMetadata && project) {
        content += `Title: ${volume.title}\n`
        content += `Project: ${project.name}\n`
        content += `\n\n`
      }

      if (options.includeTOC && chapters.length > 1) {
        content += `Table of Contents\n`
        content += `==================\n\n`
        chapters.forEach((chapter, index) => {
          content += `${index + 1}. ${chapter.title}\n`
        })
        content += `\n\n`
      }

      setExportProgress(75)

      // Add chapters
      for (const [index, chapter] of chapters.entries()) {
        if (index > 0) {
          switch (options.chapterSeparation) {
            case 'page-break':
              content += '\n\n--- PAGE BREAK ---\n\n'
              break
            case 'section':
              content += '\n\n===================\n\n'
              break
            case 'line-break':
            default:
              content += '\n\n'
              break
          }
        }

        content += `${chapter.title}\n`
        content += `${'='.repeat(chapter.title.length)}\n\n`
        
        // In a real implementation, you'd get the actual chapter content
        // from the documents table or wherever it's stored
        content += `[Chapter content for "${chapter.title}" would go here]\n\n`
      }

      setExportProgress(90)

      // Export based on format
      await downloadContent(content, `${volume.title}.${format}`, format)

      setExportProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
      throw err
    } finally {
      setIsExporting(false)
    }
  }

  const exportProject = async (
    projectId: string,
    format: ExportFormat,
    options: ExportOptions = {
      includeMetadata: true,
      includeTOC: true,
      chapterSeparation: 'page-break'
    }
  ) => {
    setIsExporting(true)
    setExportProgress(0)
    setError(null)

    try {
      // Get project and all its content
      const project = await db.projects.get(projectId)
      if (!project) throw new Error('Project not found')

      // Get volumes for this project
      const volumes = await db.volumes
        .where('projectId')
        .equals(projectId)
        .sortBy('index')

      // Get all chapters for this project
      const chapters = await db.chapters
        .where('projectId')
        .equals(projectId)
        .sortBy('index')
      
      setExportProgress(20)

      let content = ''
      
      if (options.includeMetadata) {
        content += `${project.name}\n`
        content += `${'='.repeat(project.name.length)}\n\n`
        if (project.description) {
          content += `${project.description}\n\n`
        }
      }

      setExportProgress(40)

      // Process volumes
      for (const volume of volumes) {
        const volumeChapters = chapters.filter(c => c.volumeId === volume.id)
        
        content += `\n${volume.title}\n`
        content += `${'^'.repeat(volume.title.length)}\n\n`

        for (const chapter of volumeChapters) {
          content += `${chapter.title}\n`
          content += `[Chapter content would go here]\n\n`
        }
      }

      // Standalone chapters (not in any volume)
      const standaloneChapters = chapters.filter(c => !c.volumeId)
      if (standaloneChapters.length > 0) {
        content += `\nStandalone Chapters\n`
        content += `^^^^^^^^^^^^^^^^^^^\n\n`
        
        for (const chapter of standaloneChapters) {
          content += `${chapter.title}\n`
          content += `[Chapter content would go here]\n\n`
        }
      }

      setExportProgress(80)

      await downloadContent(content, `${project.name}.${format}`, format)
      
      setExportProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
      throw err
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isExporting,
    exportProgress,
    error,
    exportVolume,
    exportProject,
  }
}

async function downloadContent(content: string, filename: string, format: ExportFormat) {
  let blob: Blob
  let mimeType: string

  switch (format) {
    case 'txt':
      blob = new Blob([content], { type: 'text/plain' })
      mimeType = 'text/plain'
      break
    case 'pdf':
      // For PDF, you'd typically use a library like pdf-lib or jsPDF
      // For now, we'll just download as text with a .pdf extension
      blob = new Blob([content], { type: 'application/pdf' })
      mimeType = 'application/pdf'
      break
    case 'epub':
      // For EPUB, you'd need a proper EPUB generation library
      blob = new Blob([content], { type: 'application/epub+zip' })
      mimeType = 'application/epub+zip'
      break
    case 'docx':
      // For DOCX, you'd use a library like docx or similar
      blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      break
    default:
      blob = new Blob([content], { type: 'text/plain' })
      mimeType = 'text/plain'
  }

  // Create download link
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

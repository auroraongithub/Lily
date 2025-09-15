"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useProjectContext } from '@/features/projects/context/ProjectContext'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useProjectData } from '@/features/projects/hooks/useProjectData'
import { useImportExport } from '@/features/import-export/hooks/useImportExport'
import { ImportModal } from '@/features/import-export/components/ImportModal'
import { ExportModal } from '@/features/import-export/components/ExportModal'
import { Upload, Download, FileText, BookOpen, ArrowLeft, Wand2 } from 'lucide-react'

export default function ImportExportPage() {
  const router = useRouter()
  const { currentProject } = useProjectContext()
  const { projects } = useProjects()
  const { volumes, chapters } = useProjectData(currentProject?.id || null)
  const { loading, error, importChapters, exportProject } = useImportExport()
  
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [status, setStatus] = useState<string>("")

  const project = useMemo(() => {
    return currentProject || projects[0] || null
  }, [currentProject, projects])

  const handleImport = async (result: { chapters: Array<{ title: string; content: string; index: number }> }) => {
    if (!project) return
    
    setStatus("Importing chapters...")
    const success = await importChapters({
      projectId: project.id,
      chapters: result.chapters
    })
    
    if (success) {
      setStatus(`Successfully imported ${result.chapters.length} chapters`)
      setShowImportModal(false)
      // Refresh the page or redirect to project
      router.push(`/projects/${project.id}`)
    } else {
      setStatus("Import failed - see console for details")
    }
  }

  const handleExport = async (options: any) => {
    if (!project) return
    
    setStatus(`Exporting as ${options.format.toUpperCase()}...`)
    await exportProject(project, chapters, options)
    setStatus(`Export complete - ${options.outputName}.${options.format}`)
    setShowExportModal(false)
  }

  const handleGeneratePdf = async () => {
    setStatus("Loading pdf-lib and generating sample...")
    try {
      const { createBlankPdf } = await import("@/features/import-export/pdf")
      const bytes = await createBlankPdf({ title: "Lily Demo" })
      const blob = new Blob([bytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "lily-demo.pdf"
      a.click()
      URL.revokeObjectURL(url)
      setStatus("Generated lily-demo.pdf")
    } catch (e) {
      console.error(e)
      setStatus("Failed to generate: see console")
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wand2 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Import & Export</h1>
              <p className="text-muted-foreground">Import novels from files or export your project in various formats</p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* Project Info */}
        {project && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{project.name}</div>
                <div className="text-sm text-muted-foreground">
                  {chapters.length} chapters • {chapters.reduce((sum: number, c: any) => sum + (c.wordCount || 0), 0).toLocaleString()} words
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Import Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Upload className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">Import Novel</h2>
                  <p className="text-sm text-muted-foreground">Import from existing documents</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>Supports Markdown (.md), HTML (.html), DOCX files</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  • Automatically splits content into chapters based on headers
                  • Preview and edit chapter titles before importing
                  • Preserves basic formatting where possible
                </div>
              </div>
              
              <Button 
                onClick={() => setShowImportModal(true)}
                disabled={!project || loading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Files
              </Button>
            </div>
          </Card>

          {/* Export Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Download className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">Export Novel</h2>
                  <p className="text-sm text-muted-foreground">Export to various formats</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Markdown</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>DOCX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>EPUB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>PDF</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  • Include metadata and front matter per chapter
                  • Customize formatting and styling options
                  • Select specific chapters to export
                </div>
              </div>
              
              <Button 
                onClick={() => setShowExportModal(true)}
                disabled={!project || chapters.length === 0 || loading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Project
              </Button>
            </div>
          </Card>
        </div>

        {/* Legacy PDF Test */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-medium">Development Tools</h3>
            <p className="text-sm text-muted-foreground">
              Heavy libraries are loaded on demand to keep initial bundle size small.
            </p>
            <Button variant="outline" onClick={handleGeneratePdf}>
              Generate Sample PDF (Test)
            </Button>
          </div>
        </Card>

        {/* Status */}
        {(status || error) && (
          <Card className="p-4">
            <div className="text-sm">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : (
                <span className="text-muted-foreground">{status}</span>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showImportModal && project && (
        <ImportModal
          projectId={project.id}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}
      
      {showExportModal && project && (
        <ExportModal
          project={project}
          volumes={volumes}
          chapters={chapters}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
        />
      )}
    </div>
  )
}

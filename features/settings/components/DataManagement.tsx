"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { db } from '@/lib/db'
import { Trash2, Download, AlertTriangle, Database } from 'lucide-react'

export function DataManagement() {
  const [isClearing, setIsClearing] = useState(false)
  const [stats, setStats] = useState<{
    projects: number
    volumes: number
    chapters: number
    documents: number
    themes: number
    notes: number
  } | null>(null)

  const loadDataStats = async () => {
    try {
      const [projects, volumes, chapters, documents, themes, notes] = await Promise.all([
        db.projects.count(),
        db.volumes.count(),
        db.chapters.count(),
        db.documents.count(),
        db.themes.count(),
        db.notes.count(),
      ])

      setStats({ projects, volumes, chapters, documents, themes, notes })
    } catch (error) {
      console.error('Failed to load data stats:', error)
    }
  }

  const exportData = async () => {
    try {
      const [projects, volumes, chapters, documents, themes, notes] = await Promise.all([
        db.projects.toArray(),
        db.volumes.toArray(),
        db.chapters.toArray(),
        db.documents.toArray(),
        db.themes.toArray(),
        db.notes.toArray(),
      ])

      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: {
          projects,
          volumes,
          chapters,
          documents,
          themes,
          notes,
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lily-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const clearAllData = async () => {
    const confirmed = confirm(
      'This will permanently delete ALL your data including projects, volumes, chapters, documents, themes, and notes. This action cannot be undone.\n\nAre you sure you want to continue?'
    )

    if (!confirmed) return

    const doubleConfirmed = confirm(
      'Last warning: This will delete EVERYTHING. Type "DELETE" in the next prompt to confirm.'
    )

    if (!doubleConfirmed) return

    const finalConfirmation = prompt(
      'Type "DELETE" (in capital letters) to confirm deletion of all data:'
    )

    if (finalConfirmation !== 'DELETE') {
      alert('Deletion cancelled.')
      return
    }

    setIsClearing(true)
    try {
      await Promise.all([
        db.projects.clear(),
        db.volumes.clear(),
        db.chapters.clear(),
        db.documents.clear(),
        db.themes.clear(),
        db.notes.clear(),
      ])

      // Clear localStorage as well
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('lily:')) {
          localStorage.removeItem(key)
        }
      })

      alert('All data has been cleared successfully.')
      setStats(null)
      
      // Reload the page to reset the application state
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear data:', error)
      alert('Failed to clear all data. Some items may remain.')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Data Management</h3>
        <p className="text-muted-foreground mb-4">
          Export your data for backup or completely reset the application.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-2">Data Statistics</h4>
              {stats ? (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Projects: {stats.projects}</div>
                  <div>Volumes: {stats.volumes}</div>
                  <div>Chapters: {stats.chapters}</div>
                  <div>Documents: {stats.documents}</div>
                  <div>Custom Themes: {stats.themes}</div>
                  <div>Notes: {stats.notes}</div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={loadDataStats}>
                  Load Statistics
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Download className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-2">Export Data</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Download all your data as a JSON backup file.
              </p>
              <Button variant="outline" size="sm" onClick={exportData}>
                Export Backup
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 border-destructive/50 bg-destructive/5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium mb-2 text-destructive">Danger Zone</h4>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete all your projects, volumes, chapters, documents, 
              custom themes, notes, and settings. This action cannot be undone.
            </p>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={clearAllData}
              disabled={isClearing}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isClearing ? 'Clearing...' : 'Clear All Data'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

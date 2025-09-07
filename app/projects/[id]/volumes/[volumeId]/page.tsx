"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Plus, BookOpen, FileText, ArrowLeft, Edit2, Trash2, Download } from 'lucide-react'
import { useVolumes, useChapters } from '@/features/projects/hooks/useVolumesAndChapters'
import { useProjectContext } from '@/features/projects/context/ProjectContext'
import { EditVolumeModal } from '@/features/projects/components/EditVolumeModal'
import type { Volume, Chapter } from '@/lib/types'

interface VolumeDetailPageProps {
  params: { id: string; volumeId: string }
}

export default function VolumeDetailPage({ params }: VolumeDetailPageProps) {
  const router = useRouter()
  const { volumes, updateVolume, deleteVolume } = useVolumes(params.id)
  const { chapters, createChapter, deleteChapter, updateChapter } = useChapters(params.id)
  const { setCurrentVolume } = useProjectContext()
  const [volume, setVolume] = useState<Volume | null>(null)
  const [showEditVolume, setShowEditVolume] = useState(false)
  const [editingVolume, setEditingVolume] = useState<Volume | null>(null)

  useEffect(() => {
    const foundVolume = volumes.find(v => v.id === params.volumeId)
    if (foundVolume) {
      setVolume(foundVolume)
      setCurrentVolume(foundVolume)
    }
  }, [volumes, params.volumeId, setCurrentVolume])

  const handleCreateChapter = async (volumeId?: string) => {
    const chapterCount = volumeId 
      ? chapters.filter(c => c.volumeId === volumeId).length
      : chapters.filter(c => !c.volumeId).length
      
    try {
      await createChapter(`Chapter ${chapterCount + 1}`, volumeId)
    } catch (error) {
      console.error('Failed to create chapter:', error)
    }
  }

  const handleVolumeAction = (volume: Volume, action: string) => {
    switch (action) {
      case 'edit':
        setEditingVolume(volume)
        setShowEditVolume(true)
        break
      case 'delete':
        deleteVolume(volume.id)
        router.back()
        break
      case 'export':
        // TODO: Implement volume export
        break
    }
  }

  const handleChapterAction = (chapter: Chapter, action: string) => {
    switch (action) {
      case 'edit':
        // TODO: Navigate to chapter editor or implement edit functionality
        break
      case 'delete':
        deleteChapter(chapter.id)
        break
      case 'export':
        // TODO: Implement chapter export
        break
    }
  }

  const getVolumeActions = (volume: Volume) => [
    { label: 'Edit Volume', icon: Edit2, onClick: () => handleVolumeAction(volume, 'edit') },
    { label: 'Export Volume', icon: Download, onClick: () => handleVolumeAction(volume, 'export') },
    { label: 'Delete Volume', icon: Trash2, destructive: true, onClick: () => handleVolumeAction(volume, 'delete') }
  ]

  const getChapterActions = (chapter: Chapter) => [
    { label: 'Edit Chapter', icon: Edit2, onClick: () => handleChapterAction(chapter, 'edit') },
    { label: 'Export Chapter', icon: Download, onClick: () => handleChapterAction(chapter, 'export') },
    { label: 'Delete Chapter', icon: Trash2, destructive: true, onClick: () => handleChapterAction(chapter, 'delete') }
  ]

  // Filter chapters for this volume and standalone chapters
  const volumeChapters = chapters.filter(c => c.volumeId === params.volumeId)
  const unvolumizedChapters = chapters.filter(c => !c.volumeId)

  if (!volume) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{volume.title}</h1>
          <p className="text-muted-foreground">Volume {volume.index}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => handleCreateChapter(params.volumeId)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Chapter
          </Button>
          <ActionMenu items={getVolumeActions(volume)} />
        </div>
      </div>

      <div className="space-y-4">
        {/* Volume Chapters */}
        {volumeChapters.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Chapters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {volumeChapters.map((chapter) => (
                <Card key={chapter.id} className="group transition-all duration-200 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold leading-tight truncate">
                          {chapter.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Chapter {chapter.index}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionMenu items={getChapterActions(chapter)} />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{chapter.wordCount || 0} words</span>
                        </div>
                        <span>Updated {new Date(chapter.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Standalone Chapters */}
        {unvolumizedChapters.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Standalone Chapters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unvolumizedChapters.map((chapter) => (
                <Card key={chapter.id} className="group transition-all duration-200 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold leading-tight truncate">
                          {chapter.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Chapter {chapter.index}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionMenu items={getChapterActions(chapter)} />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{chapter.wordCount || 0} words</span>
                        </div>
                        <span>Updated {new Date(chapter.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {volumeChapters.length === 0 && unvolumizedChapters.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Start writing your volume</h2>
            <p className="text-muted-foreground mb-6">
              Create chapters to organize your content within this volume.
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => handleCreateChapter(params.volumeId)} className="gap-2">
                <FileText className="h-4 w-4" />
                Create Chapter
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Volume Modal */}
      <EditVolumeModal
        open={showEditVolume}
        volume={editingVolume}
        onClose={() => {
          setShowEditVolume(false)
          setEditingVolume(null)
        }}
        onConfirm={updateVolume}
      />
    </div>
  )
}

"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Plus, BookOpen, FileText, ArrowLeft, Edit2, Trash2, Download } from 'lucide-react'
import { useStories, useVolumes, useChapters } from '@/features/projects/hooks/useStories'
import { useProjectContext } from '@/features/projects/context/ProjectContext'
import { EditVolumeModal } from '@/features/projects/components/EditVolumeModal'
import type { Story, Volume, Chapter } from '@/lib/types'

interface StoryDetailPageProps {
  params: { id: string; storyId: string }
}

export default function StoryDetailPage({ params }: StoryDetailPageProps) {
  const router = useRouter()
  const { stories } = useStories(params.id)
  const { volumes, createVolume, deleteVolume, updateVolume } = useVolumes(params.storyId)
  const { chapters, createChapter } = useChapters(params.storyId)
  const { setCurrentStory, setCurrentVolume } = useProjectContext()
  const [story, setStory] = useState<Story | null>(null)
  const [showEditVolume, setShowEditVolume] = useState(false)
  const [editingVolume, setEditingVolume] = useState<Volume | null>(null)

  useEffect(() => {
    const foundStory = stories.find(s => s.id === params.storyId)
    if (foundStory) {
      setStory(foundStory)
      setCurrentStory(foundStory)
    }
  }, [stories, params.storyId, setCurrentStory])

  const handleCreateVolume = async () => {
    try {
      const newVolume = await createVolume(`Volume ${volumes.length + 1}`)
      setCurrentVolume(newVolume)
    } catch (error) {
      console.error('Failed to create volume:', error)
    }
  }

  const handleCreateChapter = async (volumeId?: string) => {
    try {
      const chapterCount = volumeId 
        ? chapters.filter(c => c.volumeId === volumeId).length
        : chapters.filter(c => !c.volumeId).length
      
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
        break
      case 'export':
        // TODO: Implement volume export
        break
    }
  }

  const getVolumeActions = (volume: Volume) => [
    { label: 'Edit Volume', icon: Edit2, onClick: () => handleVolumeAction(volume, 'edit') },
    { label: 'Export Volume', icon: Download, onClick: () => handleVolumeAction(volume, 'export') },
    { label: 'Delete Volume', icon: Trash2, destructive: true, onClick: () => handleVolumeAction(volume, 'delete') }
  ]

  const unvolumizedChapters = chapters.filter(c => !c.volumeId)

  if (!story) {
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
        <div>
          <h1 className="text-2xl font-bold">{story.title}</h1>
          {story.synopsis && (
            <p className="text-muted-foreground">{story.synopsis}</p>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          <Button onClick={handleCreateVolume} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Volume
          </Button>
          <Button onClick={() => handleCreateChapter()} className="gap-2">
            <Plus className="h-4 w-4" />
            New Chapter
          </Button>
        </div>
      </div>

      {/* Volumes */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Volumes</h2>
        {volumes.length === 0 ? (
          <Card className="p-6 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No volumes yet. Create volumes to organize your chapters.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {volumes.map((volume) => {
              const volumeChapters = chapters.filter(c => c.volumeId === volume.id)
              return (
                <Card key={volume.id} className="group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{volume.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {volumeChapters.length} chapter{volumeChapters.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionMenu items={getVolumeActions(volume)} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {volumeChapters.slice(0, 3).map((chapter) => (
                      <div key={chapter.id} className="text-sm text-muted-foreground truncate">
                        {chapter.title}
                      </div>
                    ))}
                    {volumeChapters.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{volumeChapters.length - 3} more chapters
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2" 
                      onClick={() => handleCreateChapter(volume.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Chapter
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Unvolumized Chapters */}
      {unvolumizedChapters.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Standalone Chapters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {unvolumizedChapters.map((chapter) => (
              <Card key={chapter.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium truncate">{chapter.title}</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {chapter.wordCount ? `${chapter.wordCount} words` : 'No content yet'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {volumes.length === 0 && unvolumizedChapters.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Start organizing your story</h2>
          <p className="text-muted-foreground mb-6">
            Create volumes to group related chapters, or add standalone chapters directly.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={handleCreateVolume} variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Create Volume
            </Button>
            <Button onClick={() => handleCreateChapter()} className="gap-2">
              <FileText className="h-4 w-4" />
              Create Chapter
            </Button>
          </div>
        </div>
      )}

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

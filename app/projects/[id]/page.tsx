"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Plus, BookOpen, FileText, ArrowLeft, Edit2, Trash2, Download } from 'lucide-react'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useVolumes } from '@/features/projects/hooks/useVolumesAndChapters'
import { useProjectContext } from '@/features/projects/context/ProjectContext'
import { EditVolumeModal } from '@/features/projects/components/EditVolumeModal'
import type { Project, Volume } from '@/lib/types'

interface ProjectDetailPageProps {
  params: { id: string }
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter()
  const { projects } = useProjects()
  const { volumes, createVolume, deleteVolume, updateVolume } = useVolumes(params.id)
  const { setCurrentProject } = useProjectContext()
  const [project, setProject] = useState<Project | null>(null)
  const [showEditVolume, setShowEditVolume] = useState(false)
  const [editingVolume, setEditingVolume] = useState<Volume | null>(null)

  useEffect(() => {
    const foundProject = projects.find(p => p.id === params.id)
    if (foundProject) {
      setProject(foundProject)
      setCurrentProject(foundProject)
    }
  }, [projects, params.id, setCurrentProject])

  const handleCreateVolume = async () => {
    try {
      await createVolume('Untitled Volume')
    } catch (error) {
      console.error('Failed to create volume:', error)
    }
  }

  const handleVolumeClick = (volumeId: string) => {
    router.push(`/projects/${params.id}/volumes/${volumeId}`)
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

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
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
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="ml-auto">
          <Button onClick={handleCreateVolume} className="gap-2">
            <Plus className="h-4 w-4" />
            New Volume
          </Button>
        </div>
      </div>

      {volumes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No volumes yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first volume to start organizing your content into chapters.
          </p>
          <Button onClick={handleCreateVolume} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Volume
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {volumes.map((volume) => (
            <Card 
              key={volume.id}
              className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
              onClick={() => handleVolumeClick(volume.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg leading-tight truncate">
                      {volume.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Volume {volume.index}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ActionMenu items={getVolumeActions(volume)} />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>Volume</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Updated {new Date(volume.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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

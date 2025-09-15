"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Plus, FolderOpen, Folder } from 'lucide-react'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { ProjectCard } from '@/features/projects/components/ProjectCard'
import { CreateProjectModal } from '@/features/projects/components/CreateProjectModal'
import { EditProjectModal } from '@/features/projects/components/EditProjectModal'
import { useProjectContext } from '@/features/projects/context/ProjectContext'
import type { Project } from '@/lib/types'

export default function ProjectsPage() {
  const router = useRouter()
  const { projects, loading, error, createProject, updateProject, deleteProject, reorderProjects } = useProjects()
  const { setCurrentProject } = useProjectContext()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [hover, setHover] = useState<{ id: string; pos: 'before' | 'after' } | null>(null)

  const handleProjectClick = (project: Project) => {
    setCurrentProject(project)
    router.push(`/projects/${project.id}`)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowEditModal(true)
  }

  const handleDeleteProject = async (project: Project) => {
    try {
      await deleteProject(project.id)
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  // DnD for projects
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'project', id }))
    e.dataTransfer.effectAllowed = 'move'
    setDragging(id)
  }
  const onDragEnd = () => { setDragging(null); setHover(null) }
  const parsePayload = (e: React.DragEvent) => {
    try { const t = e.dataTransfer.getData('application/json'); return t ? JSON.parse(t) : null } catch { return null }
  }
  const computePos = (e: React.DragEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect(); const mid = rect.top + rect.height / 2
    return e.clientY < mid ? 'before' as const : 'after' as const
  }
  const onDropAt = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault(); e.stopPropagation()
    const payload = parsePayload(e); if (!payload || payload.type !== 'project') return
    const dragId: string = payload.id; if (dragId === targetId) return
    const order = projects.map(p => p.id).filter(id => id !== dragId)
    let idx = order.indexOf(targetId); if (idx === -1) return
    if ((hover?.id === targetId && hover.pos === 'after')) idx += 1
    order.splice(idx, 0, dragId)
    await reorderProjects(order)
    setHover(null)
  }
  const onDropEnd = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    const payload = parsePayload(e); if (!payload || payload.type !== 'project') return
    const dragId: string = payload.id
    const order = projects.map(p => p.id).filter(id => id !== dragId)
    order.push(dragId)
    await reorderProjects(order)
    setHover(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage your writing projects and stories</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage your writing projects and stories</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-destructive mb-4">Error loading projects: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Folder className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Projects</h1>
                <p className="text-muted-foreground">Manage your writing projects and stories</p>
              </div>
            </div>
          </div>

          {/* Projects Content */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Your Projects</h2>
                <p className="text-muted-foreground">Create and manage your writing projects</p>
              </div>
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first project to start organizing your stories, volumes, and chapters.
                </p>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Button>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                onDrop={onDropEnd}
              >
                {projects.map((project) => (
                  <div key={project.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, project.id)}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); const pos = computePos(e, e.currentTarget as HTMLElement); setHover({ id: project.id, pos }) }}
                    onDrop={(e) => onDropAt(e, project.id)}
                    className={
                      `transition-all ${dragging === project.id ? 'opacity-60' : ''} ` +
                      `${hover?.id === project.id && hover.pos === 'before' ? 'border-t-2 border-primary rounded' : ''} ` +
                      `${hover?.id === project.id && hover.pos === 'after' ? 'border-b-2 border-primary rounded' : ''}`
                    }
                  >
                    <ProjectCard
                      project={project}
                      onClick={() => handleProjectClick(project)}
                      onEdit={handleEditProject}
                      onDelete={handleDeleteProject}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={createProject}
      />

      <EditProjectModal
        isOpen={showEditModal}
        project={editingProject}
        onClose={() => {
          setShowEditModal(false)
          setEditingProject(null)
        }}
        onConfirm={updateProject}
      />
    </>
  )
}

"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Plus, FolderOpen } from 'lucide-react'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { ProjectCard } from '@/features/projects/components/ProjectCard'
import { CreateProjectModal } from '@/features/projects/components/CreateProjectModal'
import { EditProjectModal } from '@/features/projects/components/EditProjectModal'
import { useProjectContext } from '@/features/projects/context/ProjectContext'
import type { Project } from '@/lib/types'

export default function ProjectsPage() {
  const router = useRouter()
  const { projects, loading, error, createProject, updateProject, deleteProject } = useProjects()
  const { setCurrentProject } = useProjectContext()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage your writing projects and stories</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first project to start organizing your stories, volumes, and chapters.
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project)}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
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

"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Edit2, Trash2, BookOpen, Calendar, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
  onClick: () => void
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  className?: string
}

export function ProjectCard({ project, onClick, onEdit, onDelete, className }: ProjectCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const actionItems = [
    {
      label: 'Edit Project',
      icon: Edit2,
      onClick: () => onEdit(project)
    },
    {
      label: 'Delete Project',
      icon: Trash2,
      destructive: true,
      onClick: () => setShowDeleteModal(true)
    }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <Card 
        className={cn(
          "group cursor-pointer card-hover project-card-enter",
          className
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Cover Image */}
            <div className="flex-shrink-0">
              {project.coverUrl ? (
                <img
                  src={project.coverUrl}
                  alt={`${project.name} cover`}
                  className="w-12 h-16 object-cover rounded-md border border-border"
                />
              ) : (
                <div className="w-12 h-16 bg-muted/50 rounded-md border border-border flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight truncate">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
              
              {/* POV and Tense */}
              {(project.pov || project.tense) && (
                <div className="flex items-center gap-2 mt-2">
                  {project.pov && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                      {project.pov === 'first' ? '1st Person' :
                       project.pov === 'second' ? '2nd Person' :
                       project.pov === 'third-limited' ? '3rd Limited' :
                       project.pov === 'third-omniscient' ? '3rd Omniscient' :
                       project.pov === 'multiple' ? 'Multiple POV' : project.pov}
                    </span>
                  )}
                  {project.tense && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary/10 text-secondary-foreground">
                      {project.tense === 'present' ? 'Present' :
                       project.tense === 'past' ? 'Past' :
                       project.tense === 'future' ? 'Future' : project.tense}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Action Menu */}
            <div 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <ActionMenu items={actionItems} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>Project</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Updated {formatDate(project.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "{project.name}"? This action cannot be undone and will delete all stories, volumes, and chapters in this project.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(project)
                setShowDeleteModal(false)
              }}
            >
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

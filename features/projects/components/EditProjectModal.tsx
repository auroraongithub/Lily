"use client"

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Project } from '@/lib/types'

interface EditProjectModalProps {
  isOpen: boolean
  project: Project | null
  onClose: () => void
  onConfirm: (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>) => Promise<void>
}

export function EditProjectModal({ isOpen, project, onClose, onConfirm }: EditProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || '')
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !project) return

    setIsSubmitting(true)
    try {
      await onConfirm(project.id, {
        name: name.trim(),
        description: description.trim() || undefined
      })
      handleClose()
    } catch (error) {
      console.error('Failed to update project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    onClose()
  }

  return (
    <Modal open={isOpen} onClose={handleClose} title="Edit Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-project-name" className="block text-sm font-medium mb-2">
            Project Name *
          </label>
          <Input
            id="edit-project-name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Enter project name..."
            autoFocus
            required
          />
        </div>
        
        <div>
          <label htmlFor="edit-project-description" className="block text-sm font-medium mb-2">
            Description (optional)
          </label>
          <textarea
            id="edit-project-description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Brief description of your project..."
            className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

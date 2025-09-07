"use client"

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string, description?: string) => Promise<any>
}

export function CreateProjectModal({ isOpen, onClose, onConfirm }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await onConfirm(name.trim(), description.trim() || undefined)
      handleClose()
    } catch (error) {
      console.error('Failed to create project:', error)
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
    <Modal open={isOpen} onClose={handleClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="project-name" className="block text-sm font-medium mb-2">
            Project Name *
          </label>
          <Input
            id="project-name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Enter project name..."
            autoFocus
            required
          />
        </div>
        
        <div>
          <label htmlFor="project-description" className="block text-sm font-medium mb-2">
            Description (optional)
          </label>
          <textarea
            id="project-description"
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
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

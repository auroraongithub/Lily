"use client"

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Upload, X, Image } from 'lucide-react'
import type { Project } from '@/lib/types'

interface EditProjectModalProps {
  isOpen: boolean
  project: Project | null
  onClose: () => void
  onConfirm: (id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'coverUrl' | 'pov' | 'tense'>>) => Promise<void>
}

export function EditProjectModal({ isOpen, project, onClose, onConfirm }: EditProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [pov, setPov] = useState('')
  const [tense, setTense] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || '')
      setCoverUrl(project.coverUrl || '')
      setPov(project.pov || '')
      setTense(project.tense || '')
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !project) return

    setIsSubmitting(true)
    try {
      await onConfirm(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        coverUrl: coverUrl || undefined,
        pov: (pov || undefined) as Project['pov'],
        tense: (tense || undefined) as Project['tense']
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
    setCoverUrl('')
    setPov('')
    setTense('')
    onClose()
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCoverUrl(result)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to process image:', error)
      alert('Failed to process image. Please try again.')
    }
  }

  const removeCover = () => {
    setCoverUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Modal open={isOpen} onClose={handleClose} title="Edit Project">
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Cover Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Project Cover (optional)
          </label>
          <div className="space-y-3">
            {coverUrl ? (
              <div className="relative inline-block">
                <img
                  src={coverUrl}
                  alt="Project cover"
                  className="w-24 h-32 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Image className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground text-center">Add Cover</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              Upload an image file (max 5MB). JPG, PNG, or WebP recommended.
            </p>
          </div>
        </div>

        {/* POV and Tense Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-project-pov" className="block text-sm font-medium mb-2">
              Point of View (optional)
            </label>
            <select
              id="edit-project-pov"
              value={pov}
              onChange={(e) => setPov(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">Select POV...</option>
              <option value="first">First Person</option>
              <option value="second">Second Person</option>
              <option value="third-limited">Third Person Limited</option>
              <option value="third-omniscient">Third Person Omniscient</option>
              <option value="multiple">Multiple POV</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-project-tense" className="block text-sm font-medium mb-2">
              Tense (optional)
            </label>
            <select
              id="edit-project-tense"
              value={tense}
              onChange={(e) => setTense(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">Select Tense...</option>
              <option value="present">Present Tense</option>
              <option value="past">Past Tense</option>
              <option value="future">Future Tense</option>
            </select>
          </div>
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

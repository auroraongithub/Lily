"use client"

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Volume } from '@/lib/types'

interface EditVolumeModalProps {
  open: boolean
  volume: Volume | null
  onClose: () => void
  onConfirm: (id: string, updates: Partial<Pick<Volume, 'title'>>) => Promise<void>
}

export function EditVolumeModal({ open, volume, onClose, onConfirm }: EditVolumeModalProps) {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (volume) setTitle(volume.title)
  }, [volume])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!volume || !title.trim()) return

    setIsSubmitting(true)
    try {
      await onConfirm(volume.id, { title: title.trim() })
      handleClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit Volume">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="volume-title" className="block text-sm font-medium mb-2">
            Volume Title *
          </label>
          <Input
            id="volume-title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Enter volume title..."
            autoFocus
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

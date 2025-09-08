import React from 'react'
import { X } from 'lucide-react'
import type { MindMapNode } from '../../../lib/types'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

interface MindMapDetailsModalProps {
  node: MindMapNode
  onClose: () => void
}

export function MindMapDetailsModal({ node, onClose }: MindMapDetailsModalProps) {
  // Compute header color based on node type (custom uses its assigned color)
  const TYPE_COLORS = {
    chapter: '#3b82f6',
    event: '#ef4444',
    character: '#10b981',
    location: '#f59e0b',
    note: '#8b5cf6',
    custom: '#6b7280',
  } as const
  const headerColor = node.type === 'custom'
    ? (node.color || TYPE_COLORS.custom)
    : TYPE_COLORS[node.type]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background overflow-hidden border" style={{ borderColor: 'hsl(var(--border))' }}>
        {/* Colored top bar */}
        <div
          className="h-1 w-full"
          style={{ backgroundColor: headerColor }}
        />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{node.title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Image Display */}
            {node.image && (
              <div>
                <label className="block text-sm font-medium mb-2">Image</label>
                <div className="flex justify-center">
                  <img
                    src={node.image}
                    alt={node.title}
                    className="max-w-full max-h-80 h-auto rounded-lg border object-contain"
                  />
                </div>
              </div>
            )}

            {/* Description */}
            {node.description && (
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                  {node.description}
                </div>
              </div>
            )}

            {/* No separate detailed content section (description is primary) */}

            {/* Tags */}
            {node.tags && node.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {node.tags.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="px-3 py-1 text-sm rounded-full"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <label className="block font-medium mb-1">Created</label>
                <span>{new Date(node.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <label className="block font-medium mb-1">Last Updated</label>
                <span>{new Date(node.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

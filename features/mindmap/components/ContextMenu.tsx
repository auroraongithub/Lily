import { forwardRef } from 'react'
import type { MindMapNode } from '../../../lib/types'

interface ContextMenuProps {
  x: number
  y: number
  onCreateNode: (type: MindMapNode['type']) => void
  onClose: () => void
}

const NODE_TYPES = [
  { value: 'chapter', label: 'Chapter', icon: '📖' },
  { value: 'event', label: 'Event', icon: '⚡' },
  { value: 'character', label: 'Character', icon: '👤' },
  { value: 'location', label: 'Location', icon: '📍' },
  { value: 'note', label: 'Note', icon: '📝' },
  { value: 'custom', label: 'Custom', icon: '⭐' },
] as const

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ x, y, onCreateNode, onClose }, ref) => {
    return (
      <div
        ref={ref}
        className="fixed rounded-lg shadow-xl border py-2 z-50 min-w-[180px] mindmap-context-menu"
        style={{ 
          left: x, 
          top: y,
          transform: 'translate(-50%, -10px)',
          borderColor: 'hsl(var(--border))',
          color: 'hsl(var(--popover-foreground))',
        }}
      >
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide border-b"
          style={{ color: 'hsl(var(--muted-foreground))', borderColor: 'hsl(var(--border))' }}
        >
          Create Node
        </div>
        {NODE_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => {
              onCreateNode(type.value)
              onClose()
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors"
            style={{
              background: 'transparent',
              color: 'hsl(var(--popover-foreground))',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--muted) / 0.5)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            <span className="text-base">{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>
    )
  }
)

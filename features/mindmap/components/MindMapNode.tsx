import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Edit3, Trash2, Link, Image, Tag } from 'lucide-react'
import type { MindMapNode } from '../../../lib/types'

interface MindMapNodeData {
  node: MindMapNode
  onEdit: (node: MindMapNode) => void
  onDelete: (nodeId: string) => void
  onOpenDetails: (node: MindMapNode) => void
}

const NODE_TYPE_COLORS = {
  chapter: '#3b82f6', // blue
  event: '#ef4444',   // red
  character: '#10b981', // green
  location: '#f59e0b', // yellow
  note: '#8b5cf6',    // purple
  custom: '#6b7280',  // gray
}

const NODE_TYPE_ICONS = {
  chapter: '📖',
  event: '⚡',
  character: '👤',
  location: '📍',
  note: '📝',
  custom: '⭐',
}

function MindMapNodeComponent({ data, selected }: NodeProps<MindMapNodeData>) {
  const [isHovered, setIsHovered] = useState(false)
  const { node, onEdit, onDelete, onOpenDetails } = data
  
  const nodeColor = node.type === 'custom'
    ? (node.color || NODE_TYPE_COLORS.custom)
    : NODE_TYPE_COLORS[node.type]
  const nodeIcon = node.type === 'custom' ? (node.customIcon || NODE_TYPE_ICONS.custom) : NODE_TYPE_ICONS[node.type]

  // Compute contrast-aware text color for the header bar
  const getContrastColor = (hex: string) => {
    // Normalize #RGB or #RRGGBB
    let c = hex.replace('#', '')
    if (c.length === 3) {
      c = c.split('').map((ch) => ch + ch).join('')
    }
    const r = parseInt(c.slice(0, 2), 16) / 255
    const g = parseInt(c.slice(2, 4), 16) / 255
    const b = parseInt(c.slice(4, 6), 16) / 255
    // sRGB to linear
    const srgbToLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
    const R = srgbToLinear(r)
    const G = srgbToLinear(g)
    const B = srgbToLinear(b)
    const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B
    return luminance > 0.52 ? '#111827' /* slate-900 */ : '#ffffff'
  }
  const headerTextColor = getContrastColor(nodeColor)

  return (
    <div
      className={`relative min-w-[200px] max-w-[300px] rounded-lg border-2 shadow-lg transition-all duration-200 ${
        selected ? 'shadow-xl' : ''
      }`}
      style={{ 
        background: 'hsl(var(--card))',
        borderColor: selected ? nodeColor : 'hsl(var(--border))',
        color: 'hsl(var(--card-foreground))',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onOpenDetails(node)
      }}
    >
      {/* Handles for connections */}
      {/* Top handles */}
      <Handle id="tgt-top" type="target" position={Position.Top} className="w-3 h-3" />
      <Handle id="src-top" type="source" position={Position.Top} className="w-3 h-3" />

      {/* Right handles */}
      <Handle id="tgt-right" type="target" position={Position.Right} className="w-3 h-3" />
      <Handle id="src-right" type="source" position={Position.Right} className="w-3 h-3" />

      {/* Bottom handles */}
      <Handle id="tgt-bottom" type="target" position={Position.Bottom} className="w-3 h-3" />
      <Handle id="src-bottom" type="source" position={Position.Bottom} className="w-3 h-3" />

      {/* Left handles */}
      <Handle id="tgt-left" type="target" position={Position.Left} className="w-3 h-3" />
      <Handle id="src-left" type="source" position={Position.Left} className="w-3 h-3" />

      {/* Node Header */}
      <div 
        className="flex items-center gap-2 p-3 rounded-t-lg text-sm font-medium"
        style={{ backgroundColor: nodeColor, color: headerTextColor }}
      >
        <span className="text-lg">{nodeIcon}</span>
        <span className="flex-1 truncate">{node.title}</span>
        <span className="text-xs opacity-75 capitalize">{node.type === 'custom' ? (node.customTypeName || 'custom') : node.type}</span>
      </div>

      {/* Node Content */}
      <div className="p-3">
        {node.image && (
          <div className="mb-2">
            <img
              src={node.image}
              alt={node.title}
              className="w-full h-28 object-cover rounded-md border"
              style={{ borderColor: 'hsl(var(--border))' }}
            />
          </div>
        )}
        {node.description && (
          <p
            className="text-sm mb-2"
            style={{
              color: 'hsl(var(--muted-foreground))',
              whiteSpace: 'pre-line',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            } as React.CSSProperties}
          >
            {node.description}
          </p>
        )}
        
        {node.tags && node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {node.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {node.tags.length > 3 && (
              <span className="px-2 py-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                +{node.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {node.linkedEntities && node.linkedEntities.length > 0 && (
          <div className="flex items-center gap-1 text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Link className="w-3 h-3" />
            <span>{node.linkedEntities.length} linked entities</span>
          </div>
        )}
      </div>

      {/* Action Buttons (shown on hover or selection) */}
      {(isHovered || selected) && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(node)
            }}
            className="p-1 rounded shadow-sm transition-colors border"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
            title="Edit node"
          >
            <Edit3 className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(node.id)
            }}
            className="p-1 rounded shadow-sm transition-colors border"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
            title="Delete node"
          >
            <Trash2 className="w-4 h-4" style={{ color: 'hsl(var(--destructive))' }} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(MindMapNodeComponent)

import { useState, useEffect, useRef } from 'react'
import { X, Upload, Tag, Link } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { useMindMapCustomTypes } from '../hooks/useMindMapCustomTypes'
import type { MindMapNode } from '../../../lib/types'

interface NodeModalProps {
  node?: MindMapNode | null
  isOpen: boolean
  onClose: () => void
  onSave: (nodeData: Omit<MindMapNode, 'id' | 'createdAt' | 'updatedAt'>) => void
  projectId: string
}

const NODE_TYPES = [
  { value: 'chapter', label: 'Chapter', icon: '📖' },
  { value: 'event', label: 'Event', icon: '⚡' },
  { value: 'character', label: 'Character', icon: '👤' },
  { value: 'location', label: 'Location', icon: '📍' },
  { value: 'note', label: 'Note', icon: '📝' },
  { value: 'custom', label: 'Custom', icon: '⭐' },
] as const

const NODE_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#6b7280', '#ec4899', '#14b8a6'
]

export function NodeModal({ node, isOpen, onClose, onSave, projectId }: NodeModalProps) {
  const [formData, setFormData] = useState({
    type: 'custom' as MindMapNode['type'],
    title: '',
    description: '',
    image: '' as string | undefined,
    color: NODE_COLORS[0],
    position: { x: 0, y: 0 },
    tags: [] as string[],
    linkedEntities: [] as string[],
    customTypeId: undefined as string | undefined,
    customTypeName: '',
    customIcon: '',
  })
  const [tagInput, setTagInput] = useState('')
  const { types: savedCustomTypes, createType, deleteType, updateType } = useMindMapCustomTypes(projectId)
  const [hoverDeleteId, setHoverDeleteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTypeSelect = (value: MindMapNode['type']) => {
    setFormData((prev) => ({
      ...prev,
      type: value,
      color: value === 'custom' ? (prev.color || NODE_COLORS[0]) : undefined,
      customTypeId: value === 'custom' ? prev.customTypeId : undefined,
      customTypeName: value === 'custom' ? prev.customTypeName : '',
      customIcon: value === 'custom' ? prev.customIcon : '',
    }))
  }

  useEffect(() => {
    if (node) {
      setFormData({
        type: node.type,
        title: node.title,
        description: node.description || '',
        image: node.image || '',
        
        color: node.type === 'custom' ? (node.color || NODE_COLORS[0]) : undefined,
        position: node.position,
        tags: node.tags || [],
        linkedEntities: node.linkedEntities || [],
        customTypeId: node.customTypeId,
        customTypeName: node.customTypeName || '',
        customIcon: node.customIcon || '',
      })
    } else {
      setFormData({
        type: 'custom',
        title: '',
        description: '',
        image: '',
        
        color: NODE_COLORS[0],
        position: { x: 0, y: 0 },
        tags: [],
        linkedEntities: [],
        customTypeId: undefined,
        customTypeName: '',
        customIcon: '',
      })
    }
  }, [node])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        setFormData(prev => ({ ...prev, image: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    if (!formData.title.trim()) return

    onSave({
      projectId,
      type: formData.type,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      image: formData.image || undefined,
      
      color: formData.type === 'custom' ? formData.color : undefined,
      position: formData.position,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      linkedEntities: formData.linkedEntities.length > 0 ? formData.linkedEntities : undefined,
      customTypeId: formData.type === 'custom' ? formData.customTypeId : undefined,
      customTypeName: formData.type === 'custom' ? (formData.customTypeName || undefined) : undefined,
      customIcon: formData.type === 'custom' ? (formData.customIcon || undefined) : undefined,
    })
    onClose()
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'hsl(var(--background) / 0.6)', backdropFilter: 'blur(6px)' }}
    >
      <div 
        className="rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border entity-modal flex flex-col"
        style={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', borderColor: 'hsl(var(--border))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h2 className="text-xl font-semibold">
            {node ? 'Edit Node' : 'Create New Node'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded transition-colors"
            style={{ background: 'transparent' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--muted) / 0.6)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Node Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {NODE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleTypeSelect(type.value)}
                  className={`flex items-center gap-2 p-3 rounded border text-left transition-colors`}
                  style={{
                    borderColor: formData.type === type.value ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    background: formData.type === type.value ? 'hsl(var(--secondary))' : 'transparent',
                    color: formData.type === type.value ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  <span className="text-lg">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              style={{ 
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--input))'
              }}
              placeholder="Enter node title..."
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              style={{ 
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--input))'
              }}
              placeholder="Brief description..."
            />
          </div>

          {/* Image Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Image
            </label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </Button>
              {formData.image && (
                <div className="flex items-center gap-2">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          

          {/* Color (Custom type only) */}
          {formData.type === 'custom' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                Node Color
              </label>
              <div className="flex gap-2">
                {NODE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={async () => {
                      setFormData(prev => ({ ...prev, color }))
                      if (formData.customTypeId) {
                        await updateType(formData.customTypeId, { color })
                      }
                    }}
                    className={`w-8 h-8 rounded border-2 transition-all`}
                    style={{ backgroundColor: color, borderColor: formData.color === color ? 'hsl(var(--foreground))' : 'hsl(var(--border))', transform: formData.color === color ? 'scale(1.1)' : 'scale(1)' }}
                  />
                ))}
              </div>

              {/* Custom Type Preset */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                    Custom Type Name
                  </label>
                  <input
                    type="text"
                    value={formData.customTypeName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customTypeName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--input))' }}
                    placeholder="e.g., Prophecy, Flashback, Dream"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                    Icon (emoji/text)
                  </label>
                  <input
                    type="text"
                    value={formData.customIcon}
                    onChange={(e) => setFormData(prev => ({ ...prev, customIcon: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--input))' }}
                    placeholder="⭐ or 🔮 or txt"
                  />
                </div>
              </div>

              {/* Saved custom types picker */}
              {savedCustomTypes.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                    Saved Custom Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {savedCustomTypes.map(ct => (
                      <button
                        key={ct.id}
                        onClick={() => setFormData(prev => ({ ...prev, customTypeId: ct.id, customTypeName: ct.name, customIcon: ct.icon || '', color: ct.color }))}
                        className="px-2 py-1 rounded border text-sm flex items-center gap-2"
                        style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                        title={`Apply ${ct.name}`}
                      >
                        <span className="text-base">{ct.icon || '⭐'}</span>
                        <span>{ct.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteType(ct.id) }}
                          onMouseEnter={() => setHoverDeleteId(ct.id)}
                          onMouseLeave={() => setHoverDeleteId(null)}
                          className="w-4 h-4 rounded-full flex items-center justify-center border"
                          style={{ backgroundColor: hoverDeleteId === ct.id ? 'hsl(var(--destructive))' : ct.color, color: '#fff', borderColor: 'hsl(var(--border))' }}
                          title="Delete custom type"
                        >
                          {hoverDeleteId === ct.id ? '×' : ''}
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Save preset button */}
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={async () => {
                    const name = formData.customTypeName.trim()
                    const color = formData.color || NODE_COLORS[0]
                    if (!name) return
                    const iconTrim = (formData.customIcon || '').trim()
                    const payload: any = { projectId, name, color }
                    if (iconTrim) payload.icon = iconTrim
                    const created = await createType(payload)
                    setFormData(prev => ({ ...prev, customTypeId: created.id }))
                  }}
                  disabled={!formData.customTypeName.trim()}
                >
                  Save Custom Type
                </Button>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                style={{ 
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--input))'
                }}
                placeholder="Add a tag..."
              />
              <Button onClick={addTag} size="sm">
                <Tag className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-full"
                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t" style={{ background: 'hsl(var(--muted) / 0.3)', borderColor: 'hsl(var(--border))' }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.title.trim()}
          >
            {node ? 'Update Node' : 'Create Node'}
          </Button>
        </div>
      </div>
    </div>
  )
}

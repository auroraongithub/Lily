export type ID = string
export type ISODate = string

export interface Project {
  id: ID
  name: string
  description?: string
  createdAt: ISODate
  updatedAt: ISODate
}

export interface Volume {
  id: ID
  projectId: ID
  title: string
  index: number
  createdAt: ISODate
  updatedAt: ISODate
}

export interface Chapter {
  id: ID
  projectId: ID
  volumeId?: ID
  title: string
  index: number
  wordCount?: number
  documentId?: ID // Link to editor document
  createdAt: ISODate
  updatedAt: ISODate
}

export interface Character {
  id: ID
  name: string
  role?: string
  description?: string
  affiliations?: ID[] // Faction ids
}

export interface Location {
  id: ID
  name: string
  description?: string
}

export interface Faction {
  id: ID
  name: string
  description?: string
}

export interface Item {
  id: ID
  name: string
  description?: string
}

export interface Note {
  id: ID
  projectId?: ID
  content: string
  createdAt: ISODate
  updatedAt: ISODate
}

// Mind Map system types
export interface MindMapNode {
  id: ID
  projectId: ID
  type: 'chapter' | 'event' | 'character' | 'location' | 'note' | 'custom'
  title: string
  description?: string
  content?: string
  image?: string // base64 or URL
  color?: string
  // Custom type metadata (used when type === 'custom')
  customTypeId?: ID
  customTypeName?: string
  customIcon?: string // emoji or short text/icon name
  position: {
    x: number
    y: number
  }
  size?: {
    width: number
    height: number
  }
  linkedEntities?: ID[] // Links to chapters, characters, etc.
  tags?: string[]
  customFields?: Record<string, any>
  createdAt: ISODate
  updatedAt: ISODate
}

export interface MindMapEdge {
  id: ID
  projectId: ID
  sourceNodeId: ID
  targetNodeId: ID
  sourceHandle?: 'top' | 'right' | 'bottom' | 'left'
  targetHandle?: 'top' | 'right' | 'bottom' | 'left'
  label?: string
  type?: 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier'
  style?: Record<string, any>
  animated?: boolean
  createdAt: ISODate
}

export interface MindMapWorkspace {
  id: ID
  projectId: ID
  name: string
  description?: string
  zoomLevel: number
  viewportPosition: {
    x: number
    y: number
  }
  backgroundColor?: string
  gridVisible?: boolean
  snapToGrid?: boolean
  createdAt: ISODate
  updatedAt: ISODate
}

export interface Theme {
  id: ID
  name: string
  data: Record<string, string>
}

export interface SuggestionBank {
  id: ID
  name: string
  suggestions: string[]
}

export interface EditorDocument {
  id: ID
  title?: string
  content: string // serialized Lexical editor state (JSON string)
  createdAt: ISODate
  updatedAt: ISODate
  wordCount?: number
  charCount?: number
  // future: per-chapter splits, notes, images, etc.
}
 

// Mind Map saved custom types
export interface MindMapCustomType {
  id: ID
  projectId: ID
  name: string
  icon?: string // emoji or short text/icon name
  color: string
  createdAt: ISODate
}

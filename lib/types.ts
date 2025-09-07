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

export interface MindMap {
  id: ID
  projectId: ID
  data: unknown
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

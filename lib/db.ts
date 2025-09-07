import Dexie, { type EntityTable } from 'dexie'
import type { Project, Volume, Chapter, Note, Theme, SuggestionBank } from './types'
import type { EditorDocument } from '../features/editor/types'

export interface LilyDatabase extends Dexie {
  projects: EntityTable<Project, 'id'>
  volumes: EntityTable<Volume, 'id'>
  chapters: EntityTable<Chapter, 'id'>
  notes: EntityTable<Note, 'id'>
  themes: EntityTable<Theme, 'id'>
  suggestions: EntityTable<SuggestionBank, 'id'>
  documents: EntityTable<EditorDocument, 'id'>
}

export class LilyDB extends Dexie implements LilyDatabase {
  projects!: EntityTable<Project, 'id'>
  volumes!: EntityTable<Volume, 'id'>
  chapters!: EntityTable<Chapter, 'id'>
  notes!: EntityTable<Note, 'id'>
  themes!: EntityTable<Theme, 'id'>
  suggestions!: EntityTable<SuggestionBank, 'id'>
  documents!: EntityTable<EditorDocument, 'id'>

  constructor() {
    super('lily-db')
    this.version(4).stores({
      projects: '&id, name, updatedAt',
      volumes: '&id, projectId, title, index, updatedAt',
      chapters: '&id, projectId, volumeId, documentId, title, index, updatedAt',
      notes: '&id, projectId, updatedAt',
      themes: '&id, name, updatedAt',
      suggestions: '&id, name, updatedAt',
      documents: '&id, title, updatedAt',
    })
  }
}

export const db = new LilyDB()

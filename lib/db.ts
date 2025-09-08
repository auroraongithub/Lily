import Dexie, { type EntityTable } from 'dexie'
import type { Project, Volume, Chapter, Note, Theme, SuggestionBank, MindMapNode, MindMapEdge, MindMapWorkspace, MindMapCustomType } from './types'
import type { EditorDocument } from '../features/editor/types'

export interface LilyDatabase extends Dexie {
  projects: EntityTable<Project, 'id'>
  volumes: EntityTable<Volume, 'id'>
  chapters: EntityTable<Chapter, 'id'>
  notes: EntityTable<Note, 'id'>
  themes: EntityTable<Theme, 'id'>
  suggestions: EntityTable<SuggestionBank, 'id'>
  documents: EntityTable<EditorDocument, 'id'>
  mindMapNodes: EntityTable<MindMapNode, 'id'>
  mindMapEdges: EntityTable<MindMapEdge, 'id'>
  mindMapWorkspaces: EntityTable<MindMapWorkspace, 'id'>
  mindMapCustomTypes: EntityTable<MindMapCustomType, 'id'>
}

export class LilyDB extends Dexie implements LilyDatabase {
  projects!: EntityTable<Project, 'id'>
  volumes!: EntityTable<Volume, 'id'>
  chapters!: EntityTable<Chapter, 'id'>
  notes!: EntityTable<Note, 'id'>
  themes!: EntityTable<Theme, 'id'>
  suggestions!: EntityTable<SuggestionBank, 'id'>
  documents!: EntityTable<EditorDocument, 'id'>
  mindMapNodes!: EntityTable<MindMapNode, 'id'>
  mindMapEdges!: EntityTable<MindMapEdge, 'id'>
  mindMapWorkspaces!: EntityTable<MindMapWorkspace, 'id'>
  mindMapCustomTypes!: EntityTable<MindMapCustomType, 'id'>

  constructor() {
    super('lily-db')
    this.version(8).stores({
      projects: '&id, name, updatedAt',
      volumes: '&id, projectId, title, index, updatedAt',
      chapters: '&id, projectId, volumeId, documentId, title, index, updatedAt',
      notes: '&id, projectId, updatedAt',
      themes: '&id, name, updatedAt',
      suggestions: '&id, name, updatedAt',
      documents: '&id, title, updatedAt',
      mindMapNodes: '&id, projectId, type, title, updatedAt',
      mindMapEdges: '&id, projectId, sourceNodeId, targetNodeId',
      mindMapWorkspaces: '&id, projectId, name, updatedAt',
      mindMapCustomTypes: '&id, projectId, name',
    }).upgrade(tx => {
      // Clean up removed worldbuilding stores if they exist
      try { (tx as any).db.deleteObjectStore('worldbuildingEntities') } catch {}
      try { (tx as any).db.deleteObjectStore('worldbuildingTags') } catch {}
      try { (tx as any).db.deleteObjectStore('worldbuildingConnections') } catch {}
      try { (tx as any).db.deleteObjectStore('worldbuildingWorkspaces') } catch {}
    })
  }
}

export const db = new LilyDB()

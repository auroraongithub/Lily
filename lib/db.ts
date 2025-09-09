import Dexie, { type EntityTable } from 'dexie'
import type { Project, Volume, Chapter, Note, Theme, SuggestionBank, WorldbuildingEntity, WorldbuildingTag, WorldbuildingConnection, WorldbuildingWorkspace, MindMapNode, MindMapEdge, MindMapWorkspace, MindMapCustomType, MoodboardItem, MoodboardTheme, MoodboardWorkspace } from './types'
import type { EditorDocument } from '../features/editor/types'

export interface LilyDatabase extends Dexie {
  projects: EntityTable<Project, 'id'>
  volumes: EntityTable<Volume, 'id'>
  chapters: EntityTable<Chapter, 'id'>
  notes: EntityTable<Note, 'id'>
  themes: EntityTable<Theme, 'id'>
  suggestions: EntityTable<SuggestionBank, 'id'>
  documents: EntityTable<EditorDocument, 'id'>
  worldbuildingEntities: EntityTable<WorldbuildingEntity, 'id'>
  worldbuildingTags: EntityTable<WorldbuildingTag, 'id'>
  worldbuildingConnections: EntityTable<WorldbuildingConnection, 'id'>
  worldbuildingWorkspaces: EntityTable<WorldbuildingWorkspace, 'id'>
  mindMapNodes: EntityTable<MindMapNode, 'id'>
  mindMapEdges: EntityTable<MindMapEdge, 'id'>
  mindMapWorkspaces: EntityTable<MindMapWorkspace, 'id'>
  mindMapCustomTypes: EntityTable<MindMapCustomType, 'id'>
  moodboardItems: EntityTable<MoodboardItem, 'id'>
  moodboardThemes: EntityTable<MoodboardTheme, 'id'>
  moodboardWorkspaces: EntityTable<MoodboardWorkspace, 'id'>
}

export class LilyDB extends Dexie implements LilyDatabase {
  projects!: EntityTable<Project, 'id'>
  volumes!: EntityTable<Volume, 'id'>
  chapters!: EntityTable<Chapter, 'id'>
  notes!: EntityTable<Note, 'id'>
  themes!: EntityTable<Theme, 'id'>
  suggestions!: EntityTable<SuggestionBank, 'id'>
  documents!: EntityTable<EditorDocument, 'id'>
  worldbuildingEntities!: EntityTable<WorldbuildingEntity, 'id'>
  worldbuildingTags!: EntityTable<WorldbuildingTag, 'id'>
  worldbuildingConnections!: EntityTable<WorldbuildingConnection, 'id'>
  worldbuildingWorkspaces!: EntityTable<WorldbuildingWorkspace, 'id'>
  mindMapNodes!: EntityTable<MindMapNode, 'id'>
  mindMapEdges!: EntityTable<MindMapEdge, 'id'>
  mindMapWorkspaces!: EntityTable<MindMapWorkspace, 'id'>
  mindMapCustomTypes!: EntityTable<MindMapCustomType, 'id'>
  moodboardItems!: EntityTable<MoodboardItem, 'id'>
  moodboardThemes!: EntityTable<MoodboardTheme, 'id'>
  moodboardWorkspaces!: EntityTable<MoodboardWorkspace, 'id'>

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
      worldbuildingEntities: '&id, projectId, type, name, updatedAt',
      worldbuildingTags: '&id, name, isDefault',
      worldbuildingConnections: '&id, sourceEntityId, targetEntityId',
      worldbuildingWorkspaces: '&id, projectId, updatedAt',
      mindMapNodes: '&id, projectId, type, title, updatedAt',
      mindMapEdges: '&id, projectId, sourceNodeId, targetNodeId',
      mindMapWorkspaces: '&id, projectId, name, updatedAt',
      mindMapCustomTypes: '&id, projectId, name',
      moodboardItems: '&id, projectId, name, themeId, updatedAt',
      moodboardThemes: '&id, projectId, name, updatedAt',
      moodboardWorkspaces: '&id, projectId, name, updatedAt',
    })
  }
}

export const db = new LilyDB()

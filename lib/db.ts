import Dexie, { type EntityTable } from 'dexie'
import type { Project, Volume, Chapter, Note, Theme, SuggestionBank, WorldbuildingEntity, WorldbuildingTag, WorldbuildingConnection, WorldbuildingWorkspace, MindMapNode, MindMapEdge, MindMapWorkspace, MindMapCustomType, MoodboardItem, MoodboardTheme, MoodboardWorkspace, EntityMention, EntityProgressPoint } from './types'
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
  entityMentions: EntityTable<EntityMention, 'id'>
  entityProgressPoints: EntityTable<EntityProgressPoint, 'id'>
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
  entityMentions!: EntityTable<EntityMention, 'id'>
  entityProgressPoints!: EntityTable<EntityProgressPoint, 'id'>

  constructor() {
    super('lily-db')
    this.version(9).stores({
      projects: '&id, name, updatedAt, pov, tense',
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
    // Add v10: project index for ordering
    this.version(10).stores({
      projects: '&id, name, updatedAt, pov, tense, index',
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
    }).upgrade(async (tx) => {
      // Set sequential index for existing projects if missing
      const all = await tx.table('projects').toArray()
      // Sort by updatedAt desc like current UI, then assign indices ascending
      all.sort((a: any, b: any) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      const updates = all.map((p: any, i: number) => ({ ...p, index: (i + 1) }))
      await tx.table('projects').bulkPut(updates)
    })

    // Add v11: Codex entities
    this.version(11).stores({
      projects: '&id, name, updatedAt, pov, tense, index',
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
      entityMentions: '&id, projectId, entityId, chapterId, position',
      entityProgressPoints: '&id, projectId, entityId, chapterId, key',
    })
  }
}

export const db = new LilyDB()

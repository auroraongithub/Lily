import { useCallback } from 'react'
import { useMindMapNodes } from '../hooks/useMindMapNodes'
import { Button } from '../../../components/ui/Button'
import type { MindMapNode } from '../../../lib/types'

interface MindMapDemoProps {
  projectId: string
}

export function MindMapDemo({ projectId }: MindMapDemoProps) {
  const { createNode } = useMindMapNodes(projectId)

  const createSampleNodes = useCallback(async () => {
    const sampleNodes: Omit<MindMapNode, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        projectId,
        type: 'chapter',
        title: 'Chapter 1: The Beginning',
        description: 'Introduction to the main character and setting',
        position: { x: 100, y: 100 },
        tags: ['opening', 'character-introduction'],
      },
      {
        projectId,
        type: 'character',
        title: 'Hero Protagonist',
        description: 'The main character of our story',
        position: { x: 400, y: 100 },
        tags: ['main-character', 'hero'],
      },
      {
        projectId,
        type: 'location',
        title: 'Fantasy Kingdom',
        description: 'The primary setting for the adventure',
        position: { x: 100, y: 300 },
        tags: ['setting', 'fantasy'],
      },
      {
        projectId,
        type: 'event',
        title: 'The Inciting Incident',
        description: 'The event that sets the story in motion',
        position: { x: 400, y: 300 },
        tags: ['plot-point', 'inciting-incident'],
      },
      {
        projectId,
        type: 'chapter',
        title: 'Chapter 2: The Journey Begins',
        description: 'Hero leaves home and begins the adventure',
        position: { x: 700, y: 200 },
        tags: ['journey', 'adventure'],
      },
    ]

    try {
      for (const nodeData of sampleNodes) {
        await createNode(nodeData)
      }
    } catch (error) {
      console.error('Failed to create sample nodes:', error)
    }
  }, [projectId, createNode])

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-2">Mind Map Demo</h3>
      <p className="text-gray-600 text-sm mb-4">
        Create sample nodes to test the mind map functionality.
      </p>
      <Button onClick={createSampleNodes}>
        Create Sample Story Structure
      </Button>
    </div>
  )
}

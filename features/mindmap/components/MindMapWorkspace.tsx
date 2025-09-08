import { useState, useCallback, useRef, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Connection,
  EdgeChange,
  NodeChange,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  ConnectionLineType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Plus, Save } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import MindMapNodeComponent from './MindMapNode'
import { MindMapDetailsModal } from './MindMapDetailsModal'
import { NodeModal } from './NodeModal'
import { ContextMenu } from './ContextMenu'
import { useMindMapNodes } from '../hooks/useMindMapNodes'
import { useMindMapEdges } from '../hooks/useMindMapEdges'
import { useMindMapWorkspace } from '../hooks/useMindMapWorkspace'
import type { MindMapNode } from '../../../lib/types'

const nodeTypes = {
  mindMapNode: MindMapNodeComponent,
}

interface MindMapWorkspaceInnerProps {
  projectId: string
}

function MindMapWorkspaceInner({ projectId }: MindMapWorkspaceInnerProps) {
  const reactFlowInstance = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<MindMapNode | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    position: { x: number; y: number }
  } | null>(null)

  const [detailsNode, setDetailsNode] = useState<MindMapNode | null>(null)

  const contextMenuRef = useRef<HTMLDivElement>(null)

  const { 
    nodes: dbNodes, 
    loading: nodesLoading, 
    createNode, 
    updateNode, 
    deleteNode 
  } = useMindMapNodes(projectId)
  
  const { 
    edges: dbEdges, 
    loading: edgesLoading, 
    createEdge, 
    deleteEdge 
  } = useMindMapEdges(projectId)
  
  const { 
    workspace, 
    updateWorkspace 
  } = useMindMapWorkspace(projectId)

  // Convert database nodes to ReactFlow nodes
  useEffect(() => {
    const flowNodes: Node[] = dbNodes.map(node => ({
      id: node.id,
      type: 'mindMapNode',
      position: node.position,
      data: {
        node,
        onEdit: handleEditNode,
        onDelete: handleDeleteNode,
        onOpenDetails: handleOpenDetails,
      },
    }))
    setNodes(flowNodes)
  }, [dbNodes])

  // Convert database edges to ReactFlow edges
  useEffect(() => {
    const flowEdges: Edge[] = dbEdges.map(edge => ({
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      sourceHandle: edge.sourceHandle ? `src-${edge.sourceHandle}` : undefined,
      targetHandle: edge.targetHandle ? `tgt-${edge.targetHandle}` : undefined,
      label: edge.label,
      type: edge.type || 'default',
      style: edge.style,
      animated: edge.animated || false,
    }))
    setEdges(flowEdges)
  }, [dbEdges])

  // Restore viewport when workspace loads
  useEffect(() => {
    if (workspace && reactFlowInstance) {
      reactFlowInstance.setViewport({
        x: workspace.viewportPosition.x,
        y: workspace.viewportPosition.y,
        zoom: workspace.zoomLevel,
      })
    }
  }, [workspace, reactFlowInstance])

  const handleNodeChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes)
  }, [onNodesChange])

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        const toSide = (handleId?: string | null) => {
          if (!handleId) return undefined
          if (handleId.endsWith('left')) return 'left' as const
          if (handleId.endsWith('right')) return 'right' as const
          if (handleId.endsWith('top')) return 'top' as const
          if (handleId.endsWith('bottom')) return 'bottom' as const
          return undefined
        }

        const newEdge = {
          projectId,
          sourceNodeId: connection.source,
          targetNodeId: connection.target,
          sourceHandle: toSide(connection.sourceHandle ?? undefined),
          targetHandle: toSide(connection.targetHandle ?? undefined),
          type: 'default' as const,
        }
        createEdge(newEdge)
      }
    },
    [projectId, createEdge]
  )

  // Persist node position after drag ends (prevents jitter during fast drags)
  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    updateNode(node.id, { position: node.position })
  }, [updateNode])

  const handleEdgeChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)
      
      // Handle edge deletion
      changes.forEach(change => {
        if (change.type === 'remove') {
          deleteEdge(change.id)
        }
      })
    },
    [onEdgesChange, deleteEdge]
  )

  const handleCreateNode = useCallback(async (nodeData: Omit<MindMapNode, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createNode(nodeData)
  }, [createNode])

  const handleEditNode = useCallback((node: MindMapNode) => {
    setEditingNode(node)
    setIsNodeModalOpen(true)
  }, [])

  const handleOpenDetails = useCallback((node: MindMapNode) => {
    setDetailsNode(node)
  }, [])

  const handleUpdateNode = useCallback(async (nodeData: Omit<MindMapNode, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingNode) {
      await updateNode(editingNode.id, nodeData)
      setEditingNode(null)
    }
  }, [editingNode, updateNode])

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    if (confirm('Are you sure you want to delete this node? This will also remove all connected edges.')) {
      await deleteNode(nodeId)
    }
  }, [deleteNode])

  const handleCanvasContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    
    const bounds = event.currentTarget.getBoundingClientRect()
    const position = reactFlowInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    })

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      position,
    })
  }, [reactFlowInstance])

  const handleCreateNodeFromMenu = useCallback((type: MindMapNode['type']) => {
    if (contextMenu) {
      const nodeData = {
        projectId,
        type,
        title: `New ${type}`,
        position: contextMenu.position,
      }
      createNode(nodeData)
      setContextMenu(null)
    }
  }, [contextMenu, projectId, createNode])

  const handleViewportChange = useCallback((viewport: { x: number; y: number; zoom: number }) => {
    if (workspace) {
      updateWorkspace({
        viewportPosition: { x: viewport.x, y: viewport.y },
        zoomLevel: viewport.zoom,
      })
    }
  }, [workspace, updateWorkspace])

  const handleSaveWorkspace = useCallback(() => {
    const viewport = reactFlowInstance.getViewport()
    handleViewportChange(viewport)
  }, [reactFlowInstance, handleViewportChange])

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as HTMLElement)) {
        setContextMenu(null)
      }
    }

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu])

  if (nodesLoading || edgesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-500">Loading mind map...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative" style={{ background: 'hsl(var(--background))' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodeChange}
        onEdgesChange={handleEdgeChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        onContextMenu={handleCanvasContextMenu}
        onMoveEnd={(_, viewport) => handleViewportChange(viewport)}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.Straight}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'hsl(var(--muted-foreground) / 0.6)' },
        }}
        proOptions={{ hideAttribution: true }}
        snapToGrid={workspace?.snapToGrid ?? false}
        snapGrid={[20, 20]}
        fitView
        minZoom={0.1}
        maxZoom={2}
        className="workspace-grid"
      >
        {workspace?.gridVisible !== false && (
          <Background 
            id="mindmap-grid"
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="hsl(var(--muted-foreground) / 0.2)"
          />
        )}
        <Controls />
        
        {/* Toolbar */}
        <Panel position="top-left">
          <div 
            className="flex items-center gap-2 rounded-lg shadow-lg p-2 border"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
          >
            <Button
              size="sm"
              onClick={() => setIsNodeModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Node
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSaveWorkspace}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </Panel>

        {/* Stats */}
        <Panel position="top-right">
          <div 
            className="rounded-lg shadow-lg px-3 py-2 text-sm border"
            style={{ background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', borderColor: 'hsl(var(--border))' }}
          >
            {nodes.length} nodes • {edges.length} connections
          </div>
        </Panel>
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          ref={contextMenuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          onCreateNode={handleCreateNodeFromMenu}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Details Modal */}
      {detailsNode && (
        <MindMapDetailsModal
          node={detailsNode}
          onClose={() => setDetailsNode(null)}
        />
      )}

      {/* Node Modal */}
      <NodeModal
        node={editingNode}
        isOpen={isNodeModalOpen}
        onClose={() => {
          setIsNodeModalOpen(false)
          setEditingNode(null)
        }}
        onSave={editingNode ? handleUpdateNode : handleCreateNode}
        projectId={projectId}
      />
    </div>
  )
}

interface MindMapWorkspaceProps {
  projectId: string
}

export function MindMapWorkspace({ projectId }: MindMapWorkspaceProps) {
  return (
    <ReactFlowProvider>
      <MindMapWorkspaceInner projectId={projectId} />
    </ReactFlowProvider>
  )
}

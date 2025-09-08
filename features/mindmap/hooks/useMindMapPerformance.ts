import { useMemo, useCallback } from 'react'
import { Node, Edge } from 'reactflow'
import type { MindMapNode, MindMapEdge } from '../../../lib/types'

interface UsePerformanceOptimizationsProps {
  nodes: MindMapNode[]
  edges: MindMapEdge[]
  viewportBounds?: {
    x: number
    y: number
    width: number
    height: number
    zoom: number
  }
}

export function useMindMapPerformance({ 
  nodes, 
  edges, 
  viewportBounds 
}: UsePerformanceOptimizationsProps) {
  
  // Optimize nodes for large datasets by culling off-screen nodes
  const optimizedNodes = useMemo(() => {
    if (!viewportBounds || nodes.length < 100) {
      return nodes // No optimization needed for small datasets
    }

    const { x, y, width, height, zoom } = viewportBounds
    const buffer = 200 / zoom // Buffer to prevent popping

    return nodes.filter(node => {
      const nodeX = node.position.x
      const nodeY = node.position.y
      const nodeWidth = node.size?.width || 200
      const nodeHeight = node.size?.height || 150

      // Check if node is within viewport bounds (with buffer)
      return (
        nodeX + nodeWidth > x - buffer &&
        nodeX < x + width + buffer &&
        nodeY + nodeHeight > y - buffer &&
        nodeY < y + height + buffer
      )
    })
  }, [nodes, viewportBounds])

  // Optimize edges by only showing edges connected to visible nodes
  const optimizedEdges = useMemo(() => {
    if (!viewportBounds || edges.length < 50) {
      return edges
    }

    const visibleNodeIds = new Set(optimizedNodes.map(node => node.id))
    
    return edges.filter(edge => 
      visibleNodeIds.has(edge.sourceNodeId) || 
      visibleNodeIds.has(edge.targetNodeId)
    )
  }, [edges, optimizedNodes, viewportBounds])

  // Batch updates for better performance
  const batchUpdate = useCallback((updateFn: () => void) => {
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      updateFn()
    })
  }, [])

  // Debounced save function for viewport changes
  const debouncedSave = useCallback((saveFn: () => void) => {
    const timeoutId = setTimeout(saveFn, 500) // 500ms debounce
    return () => clearTimeout(timeoutId)
  }, [])

  return {
    optimizedNodes,
    optimizedEdges,
    batchUpdate,
    debouncedSave,
    shouldOptimize: nodes.length > 100 || edges.length > 50,
  }
}

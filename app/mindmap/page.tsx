'use client'

import { MindMapWorkspace } from '../../features/mindmap/components/MindMapWorkspace'
import { useProjectContext } from '../../features/projects/context/ProjectContext'

export default function MindMapPage() {
  const { currentProject } = useProjectContext()

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Project Selected
          </h2>
          <p className="text-gray-500">
            Please select a project to start creating your mind map.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <MindMapWorkspace projectId={currentProject.id} />
    </div>
  )
}

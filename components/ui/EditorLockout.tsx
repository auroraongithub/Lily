"use client"

import { Button } from './Button'
import { Card } from './Card'
import { Plus, BookOpen, FileText, Folder } from 'lucide-react'

interface EditorLockoutProps {
  lockoutType: 'no-project' | 'no-volume' | 'no-chapter'
  projectName?: string
  volumeName?: string
  volumes?: Array<{ id: string; title: string }>
  chapters?: Array<{ id: string; title: string }>
  onCreateProject?: () => void
  onCreateVolume?: () => void
  onCreateChapter?: () => void
  onSelectVolume?: (volumeId: string) => void
  onSelectChapter?: (chapterId: string) => void
}

export function EditorLockout({
  lockoutType,
  projectName,
  volumeName,
  volumes = [],
  chapters = [],
  onCreateProject,
  onCreateVolume,
  onCreateChapter,
  onSelectVolume,
  onSelectChapter,
}: EditorLockoutProps) {
  const renderContent = () => {
    switch (lockoutType) {
      case 'no-project':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Folder className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
              <p className="text-muted-foreground mb-4">
                You need to create or select a project to start writing.
              </p>
              <Button onClick={onCreateProject} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
            </div>
          </div>
        )

      case 'no-volume':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Volume Selected</h3>
              <p className="text-muted-foreground mb-4">
                Project: <span className="font-medium">{projectName}</span>
                <br />
                You need to create or select a volume to start writing.
              </p>
              <div className="space-y-3">
                <Button onClick={onCreateVolume} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Volume
                </Button>
                {volumes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Or select an existing volume:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {volumes.map((volume) => (
                        <Button
                          key={volume.id}
                          variant="outline"
                          onClick={() => onSelectVolume?.(volume.id)}
                          className="w-full justify-start"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          {volume.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 'no-chapter':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Chapter Selected</h3>
              <p className="text-muted-foreground mb-4">
                Project: <span className="font-medium">{projectName}</span>
                <br />
                Volume: <span className="font-medium">{volumeName}</span>
                <br />
                You need to create or select a chapter to start writing.
              </p>
              <div className="space-y-3">
                <Button onClick={onCreateChapter} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Chapter
                </Button>
                {chapters.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Or select an existing chapter:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {chapters.map((chapter) => (
                        <Button
                          key={chapter.id}
                          variant="outline"
                          onClick={() => onSelectChapter?.(chapter.id)}
                          className="w-full justify-start"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {chapter.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="absolute -top-8 -left-4 -right-4 -bottom-4 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <Card className="max-w-md mx-4 p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        {renderContent()}
      </Card>
    </div>
  )
}

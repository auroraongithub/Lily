"use client"

import { Clock, FileText, Hash, Type } from 'lucide-react'
import type { EditorStats as EditorStatsType } from '../types'

interface EditorStatsProps {
  stats: EditorStatsType
  className?: string
}

export function EditorStats({ stats, className }: EditorStatsProps) {
  return (
    <div className={`flex items-center gap-6 text-sm text-muted-foreground ${className || ''}`}>
      <div className="flex items-center gap-1">
        <Type className="h-3 w-3" />
        <span>{stats.wordCount} words</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Hash className="h-3 w-3" />
        <span>{stats.characterCount} characters</span>
      </div>
      
      <div className="flex items-center gap-1">
        <FileText className="h-3 w-3" />
        <span>{stats.paragraphCount} paragraphs</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>{stats.readingTime} min read</span>
      </div>
    </div>
  )
}

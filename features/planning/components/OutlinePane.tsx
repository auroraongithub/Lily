"use client"

import React, { useCallback, useMemo, useState } from 'react'
import type { Volume, Chapter } from '@/lib/types'

export interface OutlinePaneProps {
  projectId: string
  volumes: Volume[]
  chapters: Chapter[]
  getVolumeChapters: (volumeId: string) => Chapter[]
  reorderVolumes: (orderedIds: string[]) => Promise<void>
  reorderChapters: (volumeId: string | null | undefined, orderedIds: string[]) => Promise<void>
  moveChapter: (chapterId: string, targetVolumeId: string | null | undefined, targetIndex: number) => Promise<void>
  onSelectVolume: (volumeId: string) => void
  onSelectChapter: (chapterId: string) => void
}

type HoverPos = 'before' | 'after'

export function OutlinePane({ projectId, volumes, chapters, getVolumeChapters, reorderVolumes, reorderChapters, moveChapter, onSelectVolume, onSelectChapter }: OutlinePaneProps) {
  const [dragging, setDragging] = useState<{ type: 'volume' | 'chapter'; id: string } | null>(null)
  const [hover, setHover] = useState<{ type: 'volume' | 'chapter'; id: string; pos: HoverPos } | null>(null)

  // Drag helpers
  const onDragStart = useCallback((e: React.DragEvent, payload: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'move'
    setDragging(payload)
  }, [])

  const onDragEnd = useCallback(() => {
    setDragging(null)
    setHover(null)
  }, [])

  const parsePayload = (e: React.DragEvent) => {
    try {
      const txt = e.dataTransfer.getData('application/json')
      return txt ? JSON.parse(txt) : null
    } catch {
      return null
    }
  }

  const computePos = (e: React.DragEvent, el: HTMLElement): HoverPos => {
    const rect = el.getBoundingClientRect()
    const mid = rect.top + rect.height / 2
    return e.clientY < mid ? 'before' : 'after'
  }

  // Volumes reorder
  const onDropVolumeAt = async (e: React.DragEvent, targetId: string, pos: HoverPos) => {
    e.preventDefault(); e.stopPropagation()
    const payload = parsePayload(e)
    if (!payload || payload.type !== 'volume') return
    const dragId: string = payload.id
    if (dragId === targetId) return
    const order = volumes.map(v => v.id).filter(id => id !== dragId)
    let to = order.indexOf(targetId)
    if (to === -1) return
    if (pos === 'after') to += 1
    order.splice(to, 0, dragId)
    await reorderVolumes(order)
    setHover(null)
  }

  const onDropVolumesEnd = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    const payload = parsePayload(e)
    if (!payload || payload.type !== 'volume') return
    const dragId: string = payload.id
    const order = volumes.map(v => v.id).filter(id => id !== dragId)
    order.push(dragId)
    await reorderVolumes(order)
    setHover(null)
  }

  // Chapters reorder/move
  const onDropChapterAt = async (e: React.DragEvent, targetChapter: Chapter, pos: HoverPos) => {
    e.preventDefault(); e.stopPropagation()
    const payload = parsePayload(e)
    if (!payload || payload.type !== 'chapter') return
    const dragId: string = payload.id
    const sourceVol: string | null = payload.volumeId ?? null
    if (dragId === targetChapter.id) return

    const targetVol: string | null = targetChapter.volumeId ?? null
    const list = (targetVol ? getVolumeChapters(targetVol) : chapters.filter(c => !c.volumeId)).map(c => c.id)
    // compute target index (before/after targetChapter)
    let targetIndex = list.indexOf(targetChapter.id)
    if (pos === 'after') targetIndex += 1

    // if same container, reorder
    if (sourceVol === targetVol) {
      const reordered = list.filter(id => id !== dragId)
      reordered.splice(targetIndex, 0, dragId)
      await reorderChapters(targetVol, reordered)
    } else {
      // move to another container
      await moveChapter(dragId, targetVol, targetIndex)
    }
    setHover(null)
  }

  const onDropChaptersEnd = async (e: React.DragEvent, targetVolumeId: string | null) => {
    e.preventDefault(); e.stopPropagation()
    const payload = parsePayload(e)
    if (!payload || payload.type !== 'chapter') return
    const dragId: string = payload.id
    const sourceVol: string | null = payload.volumeId ?? null

    const list = (targetVolumeId ? getVolumeChapters(targetVolumeId) : chapters.filter(c => !c.volumeId))
      .map(c => c.id)
      .filter(id => id !== dragId)
    const targetIndex = list.length // append to end

    if (sourceVol === (targetVolumeId ?? null)) {
      const reordered = [...list, dragId]
      await reorderChapters(targetVolumeId, reordered)
    } else {
      await moveChapter(dragId, targetVolumeId, targetIndex)
    }
  }

  const rootChapters = chapters.filter(c => !c.volumeId)

  return (
    <div className="h-full w-full overflow-y-auto">
      {/* Root chapters (no volume) */}
      <div className="p-3">
        <div className="text-xs font-semibold text-muted-foreground mb-2">Chapters (no volume)</div>
        <ul
          className="space-y-1"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
          onDrop={(e) => onDropChaptersEnd(e, null)}
        >
          {rootChapters.map((ch) => (
            <li key={ch.id}>
              <div
                draggable
                onDragStart={(e) => onDragStart(e, { type: 'chapter', id: ch.id, volumeId: ch.volumeId ?? null })}
                onDragEnd={onDragEnd}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); const pos = computePos(e, e.currentTarget); setHover({ type: 'chapter', id: ch.id, pos }) }}
                onDrop={(e) => onDropChapterAt(e, ch, hover?.pos ?? 'before')}
                onClick={() => onSelectChapter(ch.id)}
                className={
                  `px-2 py-1 text-sm rounded hover:bg-accent hover:text-accent-foreground cursor-move transition-colors ` +
                  `${dragging?.type === 'chapter' && dragging?.id === ch.id ? 'opacity-60' : ''} ` +
                  `${hover?.type === 'chapter' && hover?.id === ch.id && hover.pos === 'before' ? 'border-t-2 border-primary' : ''} ` +
                  `${hover?.type === 'chapter' && hover?.id === ch.id && hover.pos === 'after' ? 'border-b-2 border-primary' : ''}`
                }
                title={ch.title}
              >
                <span className="text-muted-foreground mr-2">{ch.index}.</span>
                {ch.title}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Volumes */}
      <div className="p-3 pt-0">
        <div className="text-xs font-semibold text-muted-foreground mb-2">Volumes</div>
        <ul
          className="space-y-2"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
          onDrop={onDropVolumesEnd}
        >
          {volumes.map((v) => (
            <li key={v.id}>
              <div
                className="rounded border bg-card"
              >
                <div
                  className={
                    `px-2 py-1.5 text-sm font-medium border-b cursor-move hover:bg-accent/60 flex items-center gap-2 transition-colors ` +
                    `${dragging?.type === 'volume' && dragging?.id === v.id ? 'opacity-60' : ''} ` +
                    `${hover?.type === 'volume' && hover?.id === v.id && hover.pos === 'before' ? 'border-t-2 border-primary' : ''} ` +
                    `${hover?.type === 'volume' && hover?.id === v.id && hover.pos === 'after' ? 'border-b-2 border-primary' : ''}`
                  }
                  draggable
                  onDragStart={(e) => onDragStart(e, { type: 'volume', id: v.id })}
                  onDragEnd={onDragEnd}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); const pos = computePos(e, e.currentTarget); setHover({ type: 'volume', id: v.id, pos }) }}
                  onDrop={(e) => onDropVolumeAt(e, v.id, hover?.pos ?? 'before')}
                  onClick={() => onSelectVolume(v.id)}
                  title={v.title}
                >
                  <span className="text-muted-foreground">Vol {v.index}</span>
                  <span className="truncate">{v.title}</span>
                </div>
                <ul
                  className="p-2 space-y-1"
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                  onDrop={(e) => onDropChaptersEnd(e, v.id)}
                >
                  {(getVolumeChapters(v.id)).map((ch) => (
                    <li key={ch.id}>
                      <div
                        draggable
                        onDragStart={(e) => onDragStart(e, { type: 'chapter', id: ch.id, volumeId: v.id })}
                        onDragEnd={onDragEnd}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); const pos = computePos(e, e.currentTarget); setHover({ type: 'chapter', id: ch.id, pos }) }}
                        onDrop={(e) => onDropChapterAt(e, ch, hover?.pos ?? 'before')}
                        onClick={() => onSelectChapter(ch.id)}
                        className={
                          `px-2 py-1 text-sm rounded hover:bg-accent hover:text-accent-foreground cursor-move transition-colors ` +
                          `${dragging?.type === 'chapter' && dragging?.id === ch.id ? 'opacity-60' : ''} ` +
                          `${hover?.type === 'chapter' && hover?.id === ch.id && hover.pos === 'before' ? 'border-t-2 border-primary' : ''} ` +
                          `${hover?.type === 'chapter' && hover?.id === ch.id && hover.pos === 'after' ? 'border-b-2 border-primary' : ''}`
                        }
                        title={ch.title}
                      >
                        <span className="text-muted-foreground mr-2">{ch.index}.</span>
                        {ch.title}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

"use client"

import * as React from 'react'
import {
  DecoratorNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  $getNodeByKey,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { AlignLeft, AlignCenter, AlignRight, Move, BringToFront, SendToBack, Trash2 } from 'lucide-react'

export type ImageAlignment = 'left' | 'center' | 'right'

export type ImageWrapMode = 'inline' | 'wrapLeft' | 'wrapRight' | 'break' | 'front' | 'behind'

export type ImagePositioning = 'flow' | 'absolute'

export type ImagePayload = {
  src: string
  altText?: string
  width?: number
  height?: number
  alignment?: ImageAlignment
  wrapMode?: ImageWrapMode
  positioning?: ImagePositioning
  x?: number
  y?: number
}

export type SerializedImageNode = SerializedLexicalNode & {
  type: 'image'
  version: 1
  src: string
  altText?: string
  width?: number
  height?: number
  alignment?: ImageAlignment
  wrapMode?: ImageWrapMode
  positioning?: ImagePositioning
  x?: number
  y?: number
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function ImageComponent({ nodeKey, src, altText, width, height, alignment, wrapMode, positioning, x, y }: {
  nodeKey: NodeKey
  src: string
  altText?: string
  width?: number
  height?: number
  alignment?: ImageAlignment
  wrapMode?: ImageWrapMode
  positioning?: ImagePositioning
  x?: number
  y?: number
}) {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [menuPos, setMenuPos] = React.useState<{x: number; y: number}>({ x: 0, y: 0 })

  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)

  const startX = React.useRef(0)
  const startWidth = React.useRef<number | undefined>(width)
  const isResizing = React.useRef(false)

  const startY = React.useRef(0)
  const startLeft = React.useRef<number>(x || 0)
  const startTop = React.useRef<number>(y || 0)
  const isDragging = React.useRef(false)
  const dragDir = React.useRef<'se'|'sw'|'ne'|'nw'|'move'|null>(null)

  const onPointerDown = (e: React.PointerEvent, dir: 'se'|'sw'|'ne'|'nw') => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = imgRef.current?.getBoundingClientRect().width || width || 300
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    dragDir.current = dir
  }

  // Close context menu on outside click / Esc
  React.useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    const onClick = () => setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [menuOpen])

  const onPointerMove = (e: PointerEvent) => {
    if (isResizing.current) {
      const deltaX = e.clientX - startX.current
      const nextW = clamp((startWidth.current || 300) + (dragDir.current === 'se' || dragDir.current === 'ne' ? deltaX : -deltaX), 80, 2000)
      if (imgRef.current) {
        imgRef.current.style.width = `${nextW}px`
      }
      return
    }
    if (isDragging.current && containerRef.current) {
      const deltaX = e.clientX - startX.current
      const deltaY = e.clientY - startY.current
      const nextLeft = startLeft.current + deltaX
      const nextTop = startTop.current + deltaY
      // snap to 8px grid
      const snappedLeft = Math.round(nextLeft / 8) * 8
      const snappedTop = Math.round(nextTop / 8) * 8
      containerRef.current.style.left = `${snappedLeft}px`
      containerRef.current.style.top = `${snappedTop}px`
    }
  }

  const onPointerUp = (e: PointerEvent) => {
    if (!isResizing.current) return
    isResizing.current = false
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    const rect = imgRef.current?.getBoundingClientRect()
    const nextWidth = rect?.width ? Math.round(rect.width) : width
    if (nextWidth) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey) as ImageNode | null
        if (node) node.setWidth(nextWidth)
      })
    }
    dragDir.current = null
  }

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // If not absolute yet, switch to absolute and capture current position
    if (positioning !== 'absolute') {
      const left = containerRef.current ? (containerRef.current as HTMLElement).offsetLeft : 0
      const top = containerRef.current ? (containerRef.current as HTMLElement).offsetTop : 0
      editor.update(()=>{
        const node = $getNodeByKey(nodeKey) as ImageNode | null
        if (node) {
          node.setPositioning('absolute')
          node.setPosition(left, top)
        }
      })
      // update local refs for smooth drag start
      startLeft.current = left
      startTop.current = top
    } else {
      startLeft.current = x || 0
      startTop.current = y || 0
    }
    isDragging.current = true
    startX.current = e.clientX
    startY.current = e.clientY
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
  }

  const endDrag = (e: PointerEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', endDrag)
    if (!containerRef.current) return
    const left = parseInt(containerRef.current.style.left || '0', 10)
    const top = parseInt(containerRef.current.style.top || '0', 10)
    editor.update(() => {
      const node = $getNodeByKey(nodeKey) as ImageNode | null
      if (node) node.setPosition(left, top)
    })
  }

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    clearSelection()
    setSelected(true)
  }

  // Determine positioning mode
  const isAbsolute = positioning === 'absolute'
  // Alignment works only in flow mode. Use display: table (shrink-to-fit) so mx-auto/ml-auto work.
  const justifyClass = !isAbsolute
    ? (alignment === 'center' ? 'mx-auto' : alignment === 'right' ? 'ml-auto' : '')
    : ''

  const applyWrapMode = (mode: ImageWrapMode) => {
    // Capture current visual position if we need to switch to absolute
    const left = containerRef.current ? (containerRef.current as HTMLElement).offsetLeft : (x || 0)
    const top = containerRef.current ? (containerRef.current as HTMLElement).offsetTop : (y || 0)
    editor.update(() => {
      const node = $getNodeByKey(nodeKey) as ImageNode | null
      if (node) {
        node.setWrapMode(mode)
        if (mode === 'front' || mode === 'behind') {
          node.setPositioning('absolute')
          node.setPosition(left, top)
        }
      }
    })
  }

  const applyAlignment = (a: ImageAlignment) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey) as ImageNode | null
      if (node) node.setAlignment(a)
    })
  }

  // Base class uses display: table for shrink-to-fit so margin auto can center/right align.
  let wrapClass = 'table my-2'
  let imgZClass = ''
  switch (wrapMode) {
    case 'inline':
      wrapClass = 'table my-2'
      break
    case 'break':
      wrapClass = 'table my-2'
      break
    case 'wrapLeft':
      wrapClass = 'float-left mr-4 my-2'
      break
    case 'wrapRight':
      wrapClass = 'float-right ml-4 my-2'
      break
    case 'front':
      wrapClass = 'table'
      imgZClass = 'relative z-20'
      break
    case 'behind':
      wrapClass = 'table'
      imgZClass = 'relative -z-10'
      break
    default:
      wrapClass = 'table my-2'
  }

  const absoluteStyle: React.CSSProperties | undefined = isAbsolute
    ? { position: 'absolute', left: x || 0, top: y || 0 }
    : undefined

  const dragAlwaysVisible = isAbsolute && wrapMode === 'behind'

  return (
    <div
      ref={containerRef}
      className={`image-node relative ${wrapClass} ${justifyClass} ${dragAlwaysVisible ? 'image-drag-visible' : ''}`}
      onClick={handleClick}
      style={{ outline: isSelected ? '2px solid hsl(var(--ring))' : 'none', outlineOffset: 2, ...absoluteStyle }}
      onContextMenu={(e)=>{
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY })
        setMenuOpen(true)
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={altText || ''}
        draggable={false}
        className={`max-w-full select-none ${imgZClass}`}
        style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : 'auto' }}
        onPointerDown={isAbsolute ? startDrag : undefined}
        />
      {/* Resize handles */}
      <button className="image-resizer image-resizer-se" aria-label="Resize image" onPointerDown={(e)=>onPointerDown(e,'se')} />
      <button className="image-resizer image-resizer-sw" aria-label="Resize image" onPointerDown={(e)=>onPointerDown(e,'sw')} />
      <button className="image-resizer image-resizer-ne" aria-label="Resize image" onPointerDown={(e)=>onPointerDown(e,'ne')} />
      <button className="image-resizer image-resizer-nw" aria-label="Resize image" onPointerDown={(e)=>onPointerDown(e,'nw')} />
      {/* Drag handle when absolute */}
      {isAbsolute && (
        <button className="image-drag-handle" aria-label="Move image" onPointerDown={startDrag} />
      )}
      {/* Transparent overlay to allow dragging when image is behind text */}
      {isAbsolute && wrapMode === 'behind' && (
        <div className="image-drag-overlay" onPointerDown={startDrag} aria-hidden="true" />
      )}
      {/* Theme-aware context menu (right-click) */}
      {menuOpen && (
        <div
          className="fixed z-50 w-60 rounded-md toolbar-dropdown image-context-menu p-1 font-sans text-sm bg-popover text-popover-foreground"
          style={{ left: menuPos.x, top: menuPos.y }}
          onMouseDown={(e)=> e.stopPropagation()}
        >
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Layer</div>
          <button className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground ${wrapMode==='front' ? 'bg-accent text-accent-foreground' : ''}`} onClick={() => { applyWrapMode('front'); setMenuOpen(false) }}>
            <BringToFront className="h-4 w-4" />
            <span>Front of text</span>
          </button>
          <button className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground ${wrapMode==='behind' ? 'bg-accent text-accent-foreground' : ''}`} onClick={() => { applyWrapMode('behind'); setMenuOpen(false) }}>
            <SendToBack className="h-4 w-4" />
            <span>Behind text</span>
          </button>
          <div className="my-1 h-px bg-border" />
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Align</div>
          <button disabled={isAbsolute} className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground ${alignment==='left' && !isAbsolute ? 'bg-accent text-accent-foreground' : ''} ${isAbsolute ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => { if (!isAbsolute) { applyAlignment('left'); setMenuOpen(false) } }}>
            <AlignLeft className="h-4 w-4" />
            <span>Left</span>
          </button>
          <button disabled={isAbsolute} className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground ${alignment==='center' && !isAbsolute ? 'bg-accent text-accent-foreground' : ''} ${isAbsolute ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => { if (!isAbsolute) { applyAlignment('center'); setMenuOpen(false) } }}>
            <AlignCenter className="h-4 w-4" />
            <span>Center</span>
          </button>
          <button disabled={isAbsolute} className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground ${alignment==='right' && !isAbsolute ? 'bg-accent text-accent-foreground' : ''} ${isAbsolute ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => { if (!isAbsolute) { applyAlignment('right'); setMenuOpen(false) } }}>
            <AlignRight className="h-4 w-4" />
            <span>Right</span>
          </button>
          <div className="my-1 h-px bg-border" />
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Move</div>
          <button className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground ${isAbsolute ? 'bg-accent text-accent-foreground' : ''}`} onClick={() => { editor.update(()=>{ const node = $getNodeByKey(nodeKey) as ImageNode | null; if(node) node.setPositioning(isAbsolute ? 'flow' : 'absolute') }); setMenuOpen(false) }}>
            <Move className="h-4 w-4" />
            <span>{isAbsolute ? 'Fixed (in text)' : 'Free (absolute)'}</span>
          </button>
          <div className="my-1 h-px bg-border" />
          <button className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => { editor.update(()=>{ const node = $getNodeByKey(nodeKey) as ImageNode | null; if(node) node.remove(); }); setMenuOpen(false) }}>
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string
  __altText?: string
  __width?: number
  __height?: number
  __alignment?: ImageAlignment
  __wrapMode?: ImageWrapMode
  __positioning?: ImagePositioning
  __x?: number
  __y?: number

  static override getType(): string {
    return 'image'
  }

  static override clone(node: ImageNode): ImageNode {
    return new ImageNode({
      src: node.__src,
      altText: node.__altText,
      width: node.__width,
      height: node.__height,
      alignment: node.__alignment,
      wrapMode: node.__wrapMode,
      positioning: node.__positioning,
      x: node.__x,
      y: node.__y,
    }, node.__key)
  }

  static override importJSON(serializedNode: SerializedImageNode): ImageNode {
    return new ImageNode({
      src: serializedNode.src,
      altText: serializedNode.altText,
      width: serializedNode.width,
      height: serializedNode.height,
      alignment: serializedNode.alignment,
      wrapMode: serializedNode.wrapMode,
      positioning: serializedNode.positioning,
      x: serializedNode.x,
      y: serializedNode.y,
    })
  }

  override exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      alignment: this.__alignment,
      wrapMode: this.__wrapMode,
      positioning: this.__positioning,
      x: this.__x,
      y: this.__y,
    }
  }

  constructor(payload: ImagePayload, key?: NodeKey) {
    super(key)
    this.__src = payload.src
    this.__altText = payload.altText
    this.__width = payload.width
    this.__height = payload.height
    this.__alignment = payload.alignment || 'left'
    this.__wrapMode = payload.wrapMode || 'inline'
    this.__positioning = payload.positioning || 'flow'
    this.__x = payload.x || 0
    this.__y = payload.y || 0
  }

  override createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    return span
  }

  override updateDOM(): false {
    return false
  }

  override decorate(): JSX.Element {
    return (
      <ImageComponent
        nodeKey={this.getKey()}
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        alignment={this.__alignment}
        wrapMode={this.__wrapMode}
        positioning={this.__positioning}
        x={this.__x}
        y={this.__y}
      />
    )
  }

  setWidth(width: number) {
    const writable = this.getWritable()
    ;(writable as ImageNode).__width = width
  }

  setAlignment(alignment: ImageAlignment) {
    const writable = this.getWritable()
    ;(writable as ImageNode).__alignment = alignment
  }

  setWrapMode(mode: ImageWrapMode) {
    const writable = this.getWritable()
    ;(writable as ImageNode).__wrapMode = mode
  }

  setPosition(left: number, top: number) {
    const writable = this.getWritable()
    ;(writable as ImageNode).__x = left
    ;(writable as ImageNode).__y = top
  }

  setPositioning(mode: ImagePositioning) {
    const writable = this.getWritable()
    ;(writable as ImageNode).__positioning = mode
  }
}

export function $createImageNode(payload: ImagePayload): ImageNode {
  return new ImageNode(payload)
}

export function $isImageNode(node?: LexicalNode | null): node is ImageNode {
  return node instanceof ImageNode
}

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

export type ImageAlignment = 'left' | 'center' | 'right'

export type ImagePayload = {
  src: string
  altText?: string
  width?: number
  height?: number
  alignment?: ImageAlignment
}

export type SerializedImageNode = SerializedLexicalNode & {
  type: 'image'
  version: 1
  src: string
  altText?: string
  width?: number
  height?: number
  alignment?: ImageAlignment
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function ImageComponent({ nodeKey, src, altText, width, height, alignment }: {
  nodeKey: NodeKey
  src: string
  altText?: string
  width?: number
  height?: number
  alignment?: ImageAlignment
}) {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)

  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)

  const startX = React.useRef(0)
  const startWidth = React.useRef<number | undefined>(width)
  const isResizing = React.useRef(false)

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = imgRef.current?.getBoundingClientRect().width || width || 300
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!isResizing.current) return
    const delta = e.clientX - startX.current
    const next = clamp((startWidth.current || 300) + delta, 80, 1200)
    if (imgRef.current) {
      imgRef.current.style.width = `${next}px`
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
  }

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    clearSelection()
    setSelected(true)
  }

  const justifyClass = alignment === 'center' ? 'mx-auto' : alignment === 'right' ? 'ml-auto' : ''

  return (
    <div
      ref={containerRef}
      className={`image-node relative inline-block ${justifyClass}`}
      onClick={handleClick}
      style={{ outline: isSelected ? '2px solid hsl(var(--ring))' : 'none', outlineOffset: 2 }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={altText || ''}
        draggable={false}
        className="max-w-full select-none"
        style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : 'auto' }}
      />
      {/* Resize handle */}
      <button
        className="image-resizer"
        aria-label="Resize image"
        onPointerDown={onPointerDown}
      />
    </div>
  )
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string
  __altText?: string
  __width?: number
  __height?: number
  __alignment?: ImageAlignment

  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode({
      src: node.__src,
      altText: node.__altText,
      width: node.__width,
      height: node.__height,
      alignment: node.__alignment,
    }, node.__key)
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return new ImageNode({
      src: serializedNode.src,
      altText: serializedNode.altText,
      width: serializedNode.width,
      height: serializedNode.height,
      alignment: serializedNode.alignment,
    })
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      alignment: this.__alignment,
    }
  }

  constructor(payload: ImagePayload, key?: NodeKey) {
    super(key)
    this.__src = payload.src
    this.__altText = payload.altText
    this.__width = payload.width
    this.__height = payload.height
    this.__alignment = payload.alignment || 'left'
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    return span
  }

  updateDOM(): false {
    return false
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        nodeKey={this.getKey()}
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        alignment={this.__alignment}
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
}

export function $createImageNode(payload: ImagePayload): ImageNode {
  return new ImageNode(payload)
}

export function $isImageNode(node?: LexicalNode | null): node is ImageNode {
  return node instanceof ImageNode
}

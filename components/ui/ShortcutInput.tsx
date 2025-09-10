"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from './Button'
import { X, RotateCcw } from 'lucide-react'

interface ShortcutInputProps {
  value: string
  onChange: (keys: string) => void
  onReset?: () => void
  placeholder?: string
  disabled?: boolean
  hasConflict?: boolean
  conflictMessage?: string
  className?: string
}

export function ShortcutInput({
  value,
  onChange,
  onReset,
  placeholder = 'Press keys...',
  disabled = false,
  hasConflict = false,
  conflictMessage,
  className = '',
}: ShortcutInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Format key display names
  const formatKeyName = useCallback((key: string): string => {
    const keyMap: Record<string, string> = {
      'Control': 'Ctrl',
      'Meta': 'Cmd',
      'Alt': 'Alt',
      'Shift': 'Shift',
      ' ': 'Space',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Backspace': '⌫',
      'Delete': 'Del',
      'Enter': '↵',
      'Escape': 'Esc',
      'Tab': 'Tab',
    }
    return keyMap[key] || key.toUpperCase()
  }, [])

  // Format key combination for display and storage
  const formatKeys = useCallback((keys: Set<string>): string => {
    const order = ['Control', 'Meta', 'Alt', 'Shift']
    const sortedKeys = Array.from(keys).sort((a, b) => {
      const aIndex = order.indexOf(a)
      const bIndex = order.indexOf(b)
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.localeCompare(b)
    })
    
    return sortedKeys.map(formatKeyName).join('+')
  }, [formatKeyName])

  // Start recording keys
  const startRecording = useCallback(() => {
    if (disabled) return
    setIsRecording(true)
    setPressedKeys(new Set())
    inputRef.current?.focus()
  }, [disabled])

  // Stop recording keys
  const stopRecording = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    timeoutRef.current = setTimeout(() => {
      if (pressedKeys.size > 0) {
        const formattedKeys = formatKeys(pressedKeys)
        onChange(formattedKeys)
      }
      setIsRecording(false)
      setPressedKeys(new Set())
    }, 100) // Small delay to capture all keys in combination
  }, [pressedKeys, formatKeys, onChange])

  // Handle key down
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isRecording) return
    
    event.preventDefault()
    event.stopPropagation()
    
    const key = event.key
    
    // Ignore modifier keys by themselves initially, but track them
    if (['Control', 'Meta', 'Alt', 'Shift'].includes(key)) {
      setPressedKeys(prev => new Set([...prev, key]))
      return
    }
    
    // For other keys, include modifiers that are pressed
    const keys = new Set<string>()
    if (event.ctrlKey) keys.add('Control')
    if (event.metaKey) keys.add('Meta')
    if (event.altKey) keys.add('Alt')
    if (event.shiftKey) keys.add('Shift')
    
    // Add the actual key
    keys.add(key)
    
    setPressedKeys(keys)
  }, [isRecording])

  // Handle key up
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!isRecording) return
    
    event.preventDefault()
    event.stopPropagation()
    
    // When any key is released, stop recording after a short delay
    stopRecording()
  }, [isRecording, stopRecording])

  // Handle focus loss
  const handleBlur = useCallback(() => {
    if (isRecording) {
      stopRecording()
    }
  }, [isRecording, stopRecording])

  // Clear current shortcut
  const handleClear = useCallback(() => {
    onChange('')
    setIsRecording(false)
    setPressedKeys(new Set())
  }, [onChange])

  // Set up event listeners
  useEffect(() => {
    if (isRecording) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('keyup', handleKeyUp)
      }
    }
  }, [isRecording, handleKeyDown, handleKeyUp])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const displayValue = isRecording 
    ? (pressedKeys.size > 0 ? formatKeys(pressedKeys) : 'Recording...')
    : (value || placeholder)

  return (
    <div className={`relative ${className}`}>
      <div
        ref={inputRef}
        className={`
          flex items-center justify-between
          w-full px-3 py-2 
          text-sm
          border rounded-md
          cursor-pointer
          transition-colors
          ${isRecording 
            ? 'border-primary bg-primary/10 ring-1 ring-primary' 
            : hasConflict 
              ? 'border-destructive bg-destructive/10'
              : 'border-input bg-background hover:border-ring'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={startRecording}
        onBlur={handleBlur}
        tabIndex={0}
      >
        <span className={`
          flex-1 text-left
          ${!value && !isRecording ? 'text-muted-foreground' : ''}
          ${isRecording ? 'text-primary font-medium' : ''}
          ${hasConflict ? 'text-destructive' : ''}
        `}>
          {displayValue}
        </span>
        
        <div className="flex items-center gap-1 ml-2">
          {value && !isRecording && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {onReset && value && !isRecording && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onReset()
              }}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="Reset to default"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      {hasConflict && conflictMessage && (
        <p className="mt-1 text-xs text-destructive">
          {conflictMessage}
        </p>
      )}
      
      {isRecording && (
        <p className="mt-1 text-xs text-primary">
          Press key combination, then release to set shortcut
        </p>
      )}
    </div>
  )
}

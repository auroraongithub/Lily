// Editor-specific types for the author-optimized Lexical editor

export interface EditorDocument {
  id: string
  title: string
  content: string // Serialized Lexical editor state
  wordCount: number
  characterCount: number
  createdAt: Date
  updatedAt: Date
  fontPreset: string
  customFontSettings?: CustomFontSettings
}

export interface CustomFontSettings {
  fontFamily: string
  fontSize: number
  lineHeight: number
  letterSpacing: number
}

export type FontPreset = 'serif' | 'sans' | 'mono' | 'handwriting' | 'custom'

export type FontSize = 12 | 14 | 16 | 18 | 20 | 24 | 32 | 48 | 64

export type TextAlignment = 'left' | 'center' | 'right' | 'justify'

export type HeaderLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface EditorStats {
  wordCount: number
  characterCount: number
  characterCountNoSpaces: number
  paragraphCount: number
  readingTime: number // in minutes
}

export interface EditorSettings {
  autoSave: boolean
  autoSaveInterval: number // in milliseconds
  showWordCount: boolean
  showCharacterCount: boolean
  defaultFontPreset: FontPreset
  defaultFontSize: FontSize
  spellCheck: boolean
}

// For future extensibility - these interfaces mark where new features can be added
export interface EditorExtension {
  // Plugin system for future features like:
  // - Citations and bibliography
  // - Collaborative editing
  // - Version history
  // - Export to various formats
  // - Grammar checking
  id: string
  name: string
  enabled: boolean
}

export interface EditorTheme {
  // Theme system for future customization
  id: string
  name: string
  colors: {
    background: string
    text: string
    accent: string
    muted: string
  }
  fonts: {
    heading: string
    body: string
    mono: string
  }
}

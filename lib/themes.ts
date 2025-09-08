export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
}

export interface Theme {
  id: string
  name: string
  description?: string
  colors: ThemeColors
  isCustom: boolean
  createdAt?: string
  updatedAt?: string
}

// Predefined themes
export const defaultThemes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright theme for daytime writing',
    isCustom: false,
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      primary: '221.2 83.2% 53.3%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96%',
      secondaryForeground: '222.2 84% 4.9%',
      muted: '210 40% 96%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      accentForeground: '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '221.2 83.2% 53.3%',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes for night writing sessions',
    isCustom: false,
    colors: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      cardForeground: '210 40% 98%',
      primary: '217.2 91.2% 59.8%',
      primaryForeground: '222.2 84% 4.9%',
      secondary: '217.2 32.6% 17.5%',
      secondaryForeground: '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      mutedForeground: '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      accentForeground: '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '224.3 76.3% 94.1%',
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    description: 'Warm, paper-like theme for comfortable reading',
    isCustom: false,
    colors: {
      background: '48 96% 89%',
      foreground: '25 25% 15%',
      card: '48 96% 89%',
      cardForeground: '25 25% 15%',
      primary: '25 75% 35%',
      primaryForeground: '48 96% 89%',
      secondary: '48 30% 80%',
      secondaryForeground: '25 25% 15%',
      muted: '48 30% 80%',
      mutedForeground: '25 15% 45%',
      accent: '48 30% 80%',
      accentForeground: '25 25% 15%',
      destructive: '0 65% 45%',
      destructiveForeground: '48 96% 89%',
      border: '48 20% 75%',
      input: '48 20% 75%',
      ring: '25 75% 35%',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Nature-inspired green theme for peaceful writing',
    isCustom: false,
    colors: {
      background: '120 20% 97%',
      foreground: '120 25% 15%',
      card: '120 20% 97%',
      cardForeground: '120 25% 15%',
      primary: '142 76% 36%',
      primaryForeground: '120 20% 97%',
      secondary: '120 20% 90%',
      secondaryForeground: '120 25% 15%',
      muted: '120 20% 90%',
      mutedForeground: '120 15% 45%',
      accent: '120 20% 90%',
      accentForeground: '120 25% 15%',
      destructive: '0 65% 45%',
      destructiveForeground: '120 20% 97%',
      border: '120 15% 85%',
      input: '120 15% 85%',
      ring: '142 76% 36%',
    },
  },
  {
    id: 'purple',
    name: 'Purple Haze',
    description: 'Creative purple theme for imaginative writing',
    isCustom: false,
    colors: {
      background: '270 20% 98%',
      foreground: '270 25% 15%',
      card: '270 20% 98%',
      cardForeground: '270 25% 15%',
      primary: '262 83% 58%',
      primaryForeground: '270 20% 98%',
      secondary: '270 20% 92%',
      secondaryForeground: '270 25% 15%',
      muted: '270 20% 92%',
      mutedForeground: '270 15% 45%',
      accent: '270 20% 92%',
      accentForeground: '270 25% 15%',
      destructive: '0 65% 45%',
      destructiveForeground: '270 20% 98%',
      border: '270 15% 87%',
      input: '270 15% 87%',
      ring: '262 83% 58%',
    },
  },
  // Dark Themes
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blue-black theme for late night writing',
    isCustom: false,
    colors: {
      background: '220 27% 8%',
      foreground: '220 14% 89%',
      card: '220 27% 10%',
      cardForeground: '220 14% 89%',
      primary: '217 91% 60%',
      primaryForeground: '220 27% 8%',
      secondary: '220 14% 16%',
      secondaryForeground: '220 14% 89%',
      muted: '220 14% 16%',
      mutedForeground: '220 9% 65%',
      accent: '220 14% 16%',
      accentForeground: '220 14% 89%',
      destructive: '0 63% 31%',
      destructiveForeground: '220 14% 89%',
      border: '220 14% 16%',
      input: '220 14% 16%',
      ring: '217 91% 60%',
    },
  },
  {
    id: 'dark-forest',
    name: 'Dark Forest',
    description: 'Deep green theme for mysterious atmospheres',
    isCustom: false,
    colors: {
      background: '135 30% 6%',
      foreground: '135 15% 88%',
      card: '135 30% 8%',
      cardForeground: '135 15% 88%',
      primary: '142 70% 45%',
      primaryForeground: '135 30% 6%',
      secondary: '135 20% 12%',
      secondaryForeground: '135 15% 88%',
      muted: '135 20% 12%',
      mutedForeground: '135 10% 65%',
      accent: '135 20% 12%',
      accentForeground: '135 15% 88%',
      destructive: '0 62% 35%',
      destructiveForeground: '135 15% 88%',
      border: '135 20% 12%',
      input: '135 20% 12%',
      ring: '142 70% 45%',
    },
  },
  {
    id: 'ocean-dark',
    name: 'Ocean Dark',
    description: 'Deep teal theme inspired by ocean depths',
    isCustom: false,
    colors: {
      background: '195 40% 7%',
      foreground: '195 20% 90%',
      card: '195 40% 9%',
      cardForeground: '195 20% 90%',
      primary: '188 95% 52%',
      primaryForeground: '195 40% 7%',
      secondary: '195 30% 14%',
      secondaryForeground: '195 20% 90%',
      muted: '195 30% 14%',
      mutedForeground: '195 15% 68%',
      accent: '195 30% 14%',
      accentForeground: '195 20% 90%',
      destructive: '0 65% 40%',
      destructiveForeground: '195 20% 90%',
      border: '195 30% 14%',
      input: '195 30% 14%',
      ring: '188 95% 52%',
    },
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    description: 'Sophisticated dark gray theme for focused writing',
    isCustom: false,
    colors: {
      background: '0 0% 9%',
      foreground: '0 0% 90%',
      card: '0 0% 11%',
      cardForeground: '0 0% 90%',
      primary: '210 80% 60%',
      primaryForeground: '0 0% 9%',
      secondary: '0 0% 16%',
      secondaryForeground: '0 0% 90%',
      muted: '0 0% 16%',
      mutedForeground: '0 0% 65%',
      accent: '0 0% 16%',
      accentForeground: '0 0% 90%',
      destructive: '0 70% 35%',
      destructiveForeground: '0 0% 90%',
      border: '0 0% 16%',
      input: '0 0% 16%',
      ring: '210 80% 60%',
    },
  },
  {
    id: 'purple-dark',
    name: 'Purple Night',
    description: 'Dark purple theme for creative night sessions',
    isCustom: false,
    colors: {
      background: '270 30% 8%',
      foreground: '270 15% 88%',
      card: '270 30% 10%',
      cardForeground: '270 15% 88%',
      primary: '262 83% 58%',
      primaryForeground: '270 30% 8%',
      secondary: '270 20% 14%',
      secondaryForeground: '270 15% 88%',
      muted: '270 20% 14%',
      mutedForeground: '270 10% 65%',
      accent: '270 20% 14%',
      accentForeground: '270 15% 88%',
      destructive: '0 62% 35%',
      destructiveForeground: '270 15% 88%',
      border: '270 20% 14%',
      input: '270 20% 14%',
      ring: '262 83% 58%',
    },
  },
  // Light Themes
  {
    id: 'ocean-light',
    name: 'Ocean Breeze',
    description: 'Fresh blue-teal theme reminiscent of ocean waves',
    isCustom: false,
    colors: {
      background: '195 40% 98%',
      foreground: '195 30% 15%',
      card: '195 40% 98%',
      cardForeground: '195 30% 15%',
      primary: '188 85% 40%',
      primaryForeground: '195 40% 98%',
      secondary: '195 25% 92%',
      secondaryForeground: '195 30% 15%',
      muted: '195 25% 92%',
      mutedForeground: '195 20% 45%',
      accent: '195 25% 92%',
      accentForeground: '195 30% 15%',
      destructive: '0 75% 50%',
      destructiveForeground: '195 40% 98%',
      border: '195 20% 85%',
      input: '195 20% 85%',
      ring: '188 85% 40%',
    },
  },
  {
    id: 'rose',
    name: 'Rose Garden',
    description: 'Soft pink theme for romantic and gentle writing',
    isCustom: false,
    colors: {
      background: '340 30% 97%',
      foreground: '340 25% 15%',
      card: '340 30% 97%',
      cardForeground: '340 25% 15%',
      primary: '336 84% 57%',
      primaryForeground: '340 30% 97%',
      secondary: '340 20% 90%',
      secondaryForeground: '340 25% 15%',
      muted: '340 20% 90%',
      mutedForeground: '340 15% 45%',
      accent: '340 20% 90%',
      accentForeground: '340 25% 15%',
      destructive: '0 75% 50%',
      destructiveForeground: '340 30% 97%',
      border: '340 15% 85%',
      input: '340 15% 85%',
      ring: '336 84% 57%',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange theme inspired by golden hour',
    isCustom: false,
    colors: {
      background: '35 45% 96%',
      foreground: '35 30% 18%',
      card: '35 45% 96%',
      cardForeground: '35 30% 18%',
      primary: '25 95% 53%',
      primaryForeground: '35 45% 96%',
      secondary: '35 25% 88%',
      secondaryForeground: '35 30% 18%',
      muted: '35 25% 88%',
      mutedForeground: '35 20% 48%',
      accent: '35 25% 88%',
      accentForeground: '35 30% 18%',
      destructive: '0 75% 50%',
      destructiveForeground: '35 45% 96%',
      border: '35 20% 82%',
      input: '35 20% 82%',
      ring: '25 95% 53%',
    },
  },
]

// Theme utility functions
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value)
  })
}

export function createCustomTheme(
  name: string, 
  description: string, 
  colors: ThemeColors
): Theme {
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    colors,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function getThemePreview(colors: ThemeColors): string {
  return `
    background: hsl(${colors.background});
    color: hsl(${colors.foreground});
    border: 1px solid hsl(${colors.border});
  `
}

// Convert hex to HSL for theme colors
export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

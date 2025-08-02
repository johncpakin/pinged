'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'orange' | 'blue' | 'pink' | 'purple' | 'green'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  themes: { 
    value: Theme
    name: string
    colors: {
      primary: string
      secondary: string
    }
  }[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const themes = [
  {
    value: 'orange' as Theme,
    name: 'Gaming Orange',
    colors: {
      primary: '#FF9C00',
      secondary: '#AC3601'
    }
  },
  {
    value: 'blue' as Theme,
    name: 'Electric Blue',
    colors: {
      primary: '#3B82F6',
      secondary: '#1E40AF'
    }
  },
  {
    value: 'pink' as Theme,
    name: 'Neon Pink',
    colors: {
      primary: '#EC4899',
      secondary: '#BE185D'
    }
  },
  {
    value: 'purple' as Theme,
    name: 'Cyber Purple',
    colors: {
      primary: '#8B5CF6',
      secondary: '#6D28D9'
    }
  },
  {
    value: 'green' as Theme,
    name: 'Matrix Green',
    colors: {
      primary: '#10B981',
      secondary: '#047857'
    }
  }
]

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('orange')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('pinged-theme') as Theme
    if (savedTheme && themes.find(t => t.value === savedTheme)) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme)
    
    // Save to localStorage
    localStorage.setItem('pinged-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme Selector Component
export function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-text-primary">Choose Theme</h4>
      <div className="grid grid-cols-1 gap-2">
        {themes.map((themeOption) => (
          <button
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value)}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
              theme === themeOption.value
                ? 'border-brand-primary bg-brand-primary/10'
                : 'border-ui-border bg-ui-surface hover:bg-ui-surface-hover'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div 
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: themeOption.colors.primary }}
                />
                <div 
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: themeOption.colors.secondary }}
                />
              </div>
              <span className="text-sm font-medium text-text-primary">
                {themeOption.name}
              </span>
            </div>
            {theme === themeOption.value && (
              <div className="w-2 h-2 bg-brand-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
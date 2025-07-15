import { useState, useEffect } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('visionaid_theme')
    return (saved as Theme) || 'light'
  })

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('dark')
    
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else if (newTheme === 'light') {
      // Light mode is default, no class needed
    } else { // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      }
    }
  }

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('visionaid_theme', newTheme)
    applyTheme(newTheme)
  }

  useEffect(() => {
    applyTheme(theme)

    // Listen for system theme changes when using 'system' theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme('system')
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  // Apply theme on initial load
  useEffect(() => {
    applyTheme(theme)
  }, [])

  return { theme, changeTheme }
}
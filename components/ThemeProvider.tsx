'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
    mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

interface ThemeProviderProps {
    children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>('dark')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Get theme from localStorage or system preference
        const savedTheme = localStorage.getItem('logiz-theme') as Theme | null
        if (savedTheme) {
            setThemeState(savedTheme)
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            setThemeState('light')
        }
    }, [])

    useEffect(() => {
        if (mounted) {
            // Update document class
            const root = document.documentElement
            root.classList.remove('light', 'dark')
            root.classList.add(theme)

            // Save to localStorage
            localStorage.setItem('logiz-theme', theme)
        }
    }, [theme, mounted])

    const toggleTheme = () => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
    }

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
    }

    // Always provide context, even before mount
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    )
}

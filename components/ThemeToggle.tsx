'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
    className?: string
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
    const { theme, toggleTheme, mounted } = useTheme()

    // Show skeleton during hydration
    if (!mounted) {
        return (
            <div className={cn(
                'p-2 rounded-lg bg-gray-800/50 border border-gray-700/50',
                className
            )}>
                <div className="w-5 h-5" />
            </div>
        )
    }

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                'relative p-2 rounded-lg transition-colors',
                'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50',
                'dark:bg-gray-800/50 dark:hover:bg-gray-700/50',
                'light:bg-gray-200/50 light:hover:bg-gray-300/50 light:border-gray-300/50',
                className
            )}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <div className="relative w-5 h-5">
                <motion.div
                    initial={false}
                    animate={{
                        scale: theme === 'dark' ? 1 : 0,
                        opacity: theme === 'dark' ? 1 : 0,
                        rotate: theme === 'dark' ? 0 : -90,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <Moon className="w-5 h-5 text-cyan-400" />
                </motion.div>
                <motion.div
                    initial={false}
                    animate={{
                        scale: theme === 'light' ? 1 : 0,
                        opacity: theme === 'light' ? 1 : 0,
                        rotate: theme === 'light' ? 0 : 90,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <Sun className="w-5 h-5 text-amber-400" />
                </motion.div>
            </div>
        </button>
    )
}

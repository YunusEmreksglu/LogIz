'use client'

import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
    title: string
    subtitle?: string
    isLive?: boolean
    onRefresh?: () => void
    refreshing?: boolean
}

export default function PageHeader({
    title,
    subtitle,
    isLive = false,
    onRefresh,
    refreshing = false,
}: PageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between mb-8"
        >
            <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                {subtitle && (
                    <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
                )}
            </div>

            <div className="flex items-center space-x-3">
                {/* Live Indicator */}
                {isLive && (
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm font-medium text-emerald-400">Live</span>
                    </div>
                )}

                {/* Refresh Button */}
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={refreshing}
                        className={cn(
                            'flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200',
                            'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600',
                            'text-gray-300 hover:text-white',
                            refreshing && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
                        <span className="text-sm font-medium">Refresh</span>
                    </button>
                )}
            </div>
        </motion.div>
    )
}

'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GradientStatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    badge?: {
        text: string
        type: 'success' | 'warning' | 'danger' | 'info'
    }
    subtitle?: string
    gradient: 'blue' | 'purple' | 'green' | 'orange' | 'red'
    delay?: number
}

const gradientStyles = {
    blue: {
        bg: 'from-blue-500/20 via-blue-500/10 to-transparent',
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400',
        border: 'border-blue-500/20 hover:border-blue-500/40',
    },
    purple: {
        bg: 'from-purple-500/20 via-purple-500/10 to-transparent',
        iconBg: 'bg-purple-500/20',
        iconColor: 'text-purple-400',
        border: 'border-purple-500/20 hover:border-purple-500/40',
    },
    green: {
        bg: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        border: 'border-emerald-500/20 hover:border-emerald-500/40',
    },
    orange: {
        bg: 'from-orange-500/20 via-orange-500/10 to-transparent',
        iconBg: 'bg-orange-500/20',
        iconColor: 'text-orange-400',
        border: 'border-orange-500/20 hover:border-orange-500/40',
    },
    red: {
        bg: 'from-red-500/20 via-red-500/10 to-transparent',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
        border: 'border-red-500/20 hover:border-red-500/40',
    },
}

const badgeStyles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

export default function GradientStatCard({
    title,
    value,
    icon: Icon,
    badge,
    subtitle,
    gradient,
    delay = 0,
}: GradientStatCardProps) {
    const styles = gradientStyles[gradient]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={cn(
                'relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300',
                'bg-gray-900/50',
                styles.border
            )}
        >
            {/* Gradient Background */}
            <div className={cn('absolute inset-0 bg-gradient-to-br', styles.bg)} />

            {/* Content */}
            <div className="relative p-6">
                {/* Icon */}
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', styles.iconBg)}>
                    <Icon className={cn('w-6 h-6', styles.iconColor)} />
                </div>

                {/* Value */}
                <div className="text-3xl font-bold text-white mb-1">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>

                {/* Title */}
                <div className="text-sm text-gray-400 mb-3">{title}</div>

                {/* Badge or Subtitle */}
                {badge && (
                    <span className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                        badgeStyles[badge.type]
                    )}>
                        {badge.type === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />}
                        {badge.type === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5" />}
                        {badge.type === 'danger' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 animate-pulse" />}
                        {badge.text}
                    </span>
                )}
                {subtitle && !badge && (
                    <span className="text-xs text-gray-500">{subtitle}</span>
                )}
            </div>
        </motion.div>
    )
}

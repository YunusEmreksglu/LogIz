'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
    icon: LucideIcon
    title: string
    description: string
    highlight?: string
    color: 'cyan' | 'purple' | 'emerald' | 'amber' | 'red'
    delay?: number
}

const colorStyles = {
    cyan: {
        icon: 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20',
        border: 'hover:border-cyan-500/50',
        highlight: 'text-cyan-400',
    },
    purple: {
        icon: 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20',
        border: 'hover:border-purple-500/50',
        highlight: 'text-purple-400',
    },
    emerald: {
        icon: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20',
        border: 'hover:border-emerald-500/50',
        highlight: 'text-emerald-400',
    },
    amber: {
        icon: 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20',
        border: 'hover:border-amber-500/50',
        highlight: 'text-amber-400',
    },
    red: {
        icon: 'bg-red-500/10 text-red-400 group-hover:bg-red-500/20',
        border: 'hover:border-red-500/50',
        highlight: 'text-red-400',
    },
}

export default function FeatureCard({ icon: Icon, title, description, highlight, color, delay = 0 }: FeatureCardProps) {
    const styles = colorStyles[color]

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                'group p-8 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 backdrop-blur-sm',
                'border border-gray-800/50 transition-all duration-300',
                styles.border
            )}
        >
            {/* Icon */}
            <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors',
                styles.icon
            )}>
                <Icon className="w-7 h-7" />
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed mb-4">{description}</p>

            {/* Highlight */}
            {highlight && (
                <div className={cn('text-2xl font-bold', styles.highlight)}>
                    {highlight}
                </div>
            )}
        </motion.div>
    )
}

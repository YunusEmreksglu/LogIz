'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circular' | 'rectangular' | 'card'
    width?: string | number
    height?: string | number
    lines?: number
}

export function Skeleton({
    className,
    variant = 'rectangular',
    width,
    height,
    lines = 1
}: SkeletonProps) {
    const baseClasses = 'bg-gray-800/50 animate-pulse'

    const variantClasses = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
        card: 'rounded-2xl',
    }

    if (variant === 'text' && lines > 1) {
        return (
            <div className={cn('space-y-2', className)}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(baseClasses, variantClasses.text)}
                        style={{
                            width: i === lines - 1 ? '60%' : '100%',
                            height
                        }}
                    />
                ))}
            </div>
        )
    }

    return (
        <div
            className={cn(baseClasses, variantClasses[variant], className)}
            style={{ width, height }}
        />
    )
}

// Card skeleton for dashboard
export function CardSkeleton() {
    return (
        <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-700/50">
            <div className="flex items-center space-x-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                </div>
            </div>
        </div>
    )
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="rounded-2xl bg-gray-900/50 border border-gray-700/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-700/50 bg-gray-800/30">
                <Skeleton variant="text" width="30%" />
            </div>
            {/* Rows */}
            <div className="divide-y divide-gray-700/30">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="p-4 flex items-center space-x-4">
                        <Skeleton variant="circular" width={32} height={32} />
                        <div className="flex-1 space-y-2">
                            <Skeleton variant="text" width="80%" />
                            <Skeleton variant="text" width="50%" />
                        </div>
                        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}

// Chart skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
    return (
        <div className="rounded-2xl bg-gray-900/50 border border-gray-700/50 p-6">
            <Skeleton variant="text" width="40%" className="mb-6" />
            <Skeleton variant="rectangular" height={height} />
        </div>
    )
}

// Stats grid skeleton
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-6`}>
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    )
}

// Page loading skeleton
export function PageSkeleton() {
    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="text" width={300} />
                </div>
                <Skeleton variant="rectangular" width={120} height={40} className="rounded-xl" />
            </div>

            {/* Stats Grid */}
            <StatsGridSkeleton />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ChartSkeleton />
                </div>
                <ChartSkeleton height={250} />
            </div>

            {/* Table */}
            <TableSkeleton />
        </div>
    )
}

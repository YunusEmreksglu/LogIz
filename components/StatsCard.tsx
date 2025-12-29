'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export default function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 border border-gray-700 hover:border-cyber-blue/50 transition-all duration-300 group",
      className
    )}>
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-blue/0 to-cyber-blue/0 group-hover:from-cyber-blue/5 group-hover:to-cyber-blue/10 transition-all duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-2">{title}</p>
            <p className="text-3xl font-bold text-white mb-2">{value}</p>
            {trend && (
              <div className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-cyber-green" : "text-cyber-red"
              )}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-cyber-blue/10 text-cyber-blue">
            {icon}
          </div>
        </div>
      </div>
      
      {/* Animated border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  )
}

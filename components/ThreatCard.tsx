'use client'

import { Threat } from '@/types'
import { AlertTriangle, Shield, Info } from 'lucide-react'
import { getThreatColor, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ThreatCardProps {
  threat: Threat
  onClick?: () => void
}

export default function ThreatCard({ threat, onClick }: ThreatCardProps) {
  const severityIcons = {
    CRITICAL: AlertTriangle,
    HIGH: AlertTriangle,
    MEDIUM: Shield,
    LOW: Shield,
    INFO: Info,
  }

  const Icon = severityIcons[threat.severity] || Info

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border bg-gray-900/50 backdrop-blur-sm transition-all duration-300 cursor-pointer hover:scale-[1.02]",
        getThreatColor(threat.severity),
        onClick && "hover:shadow-lg"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-lg",
            getThreatColor(threat.severity)
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">
              {threat.type.replace(/_/g, ' ')}
            </h3>
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              getThreatColor(threat.severity)
            )}>
              {threat.severity}
            </span>
          </div>
        </div>
        
        {threat.confidence && (
          <div className="text-xs text-gray-400">
            {Math.round(threat.confidence * 100)}% confidence
          </div>
        )}
      </div>

      <p className="text-sm text-gray-300 mb-3">{threat.description}</p>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {threat.sourceIP && (
          <div>
            <span className="text-gray-500">Source IP:</span>
            <span className="ml-2 text-gray-300 font-mono">{threat.sourceIP}</span>
          </div>
        )}
        {threat.targetIP && (
          <div>
            <span className="text-gray-500">Target IP:</span>
            <span className="ml-2 text-gray-300 font-mono">{threat.targetIP}</span>
          </div>
        )}
        {threat.port && (
          <div>
            <span className="text-gray-500">Port:</span>
            <span className="ml-2 text-gray-300 font-mono">{threat.port}</span>
          </div>
        )}
        {threat.timestamp && (
          <div>
            <span className="text-gray-500">Time:</span>
            <span className="ml-2 text-gray-300">{formatDate(threat.timestamp)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

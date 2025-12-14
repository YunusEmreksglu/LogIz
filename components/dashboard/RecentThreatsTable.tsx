'use client'

import { motion } from 'framer-motion'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Threat {
    id: string
    timestamp: string
    sourceIP: string
    destinationIP?: string
    type: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
    action?: string
}

interface RecentThreatsTableProps {
    threats: Threat[]
    maxItems?: number
}

const severityConfig = {
    CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    MEDIUM: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    LOW: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    INFO: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
}

const actionConfig = {
    Block: { bg: 'bg-red-500', text: 'text-white' },
    Passthrough: { bg: 'bg-emerald-500', text: 'text-white' },
    Alert: { bg: 'bg-yellow-500', text: 'text-black' },
    Pass: { bg: 'bg-emerald-500', text: 'text-white' },
    Info: { bg: 'bg-gray-500', text: 'text-white' },
}

export default function RecentThreatsTable({ threats, maxItems = 5 }: RecentThreatsTableProps) {
    const displayThreats = threats.slice(0, maxItems)

    const formatTime = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        } catch {
            return timestamp
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
                <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <h3 className="text-lg font-semibold text-white">Recent Security Events</h3>
                </div>
                <Link
                    href="/history"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyber-blue/10 text-cyber-blue text-sm font-medium hover:bg-cyber-blue/20 transition-colors"
                >
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="border-b border-gray-700/50">
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Time</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Source IP</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Destination</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Severity</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                        {displayThreats.length > 0 ? (
                            displayThreats.map((threat, index) => {
                                const severity = severityConfig[threat.severity] || severityConfig.INFO
                                const action = actionConfig[threat.action as keyof typeof actionConfig] || actionConfig.Info

                                return (
                                    <motion.tr
                                        key={threat.id || index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                                    >
                                        <td className="px-5 py-4 text-sm text-gray-300 font-mono">
                                            {formatTime(threat.timestamp)}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-300 font-mono">
                                            {threat.sourceIP || '—'}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-300 font-mono">
                                            {threat.destinationIP || '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                                                severity.bg, severity.text, severity.border
                                            )}>
                                                {threat.severity}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
                                                action.bg, action.text
                                            )}>
                                                {threat.action || 'Info'}
                                            </span>
                                        </td>
                                    </motion.tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                                    No recent security events
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    )
}

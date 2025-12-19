'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LogEntry } from '@/app/(dashboard)/logs/page'

interface LogTableProps {
    logs: LogEntry[]
    loading: boolean
    onLogClick: (log: LogEntry) => void
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    itemsPerPage: number
    totalItems: number
}

const severityConfig = {
    CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    MEDIUM: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    LOW: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    INFO: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
}

const actionConfig: Record<string, { bg: string; text: string }> = {
    Block: { bg: 'bg-red-500', text: 'text-white' },
    Deny: { bg: 'bg-red-500', text: 'text-white' },
    Pass: { bg: 'bg-emerald-500', text: 'text-white' },
    Passthrough: { bg: 'bg-emerald-500', text: 'text-white' },
    Alert: { bg: 'bg-yellow-500', text: 'text-black' },
}

export default function LogTable({
    logs,
    loading,
    onLogClick,
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    totalItems,
}: LogTableProps) {
    const formatTime = (timestamp: string) => {
        try {
            const date = new Date(timestamp)
            return date.toLocaleString('tr-TR', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })
        } catch {
            return timestamp
        }
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    if (loading) {
        return (
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
                <div className="flex items-center justify-center h-[400px]">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400">Loading logs...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden"
        >
            {/* Table Header Info */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
                <span className="text-sm text-gray-400">
                    Showing {startItem}-{endItem} of {totalItems.toLocaleString()}
                </span>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">{itemsPerPage} / page</span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                    <thead>
                        <tr className="border-b border-gray-700/50 bg-gray-800/30">
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Timestamp</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Type</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Source IP</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Dest IP</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Download</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Upload</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Severity</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Action</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                        {logs.length > 0 ? (
                            logs.map((log, index) => {
                                const severity = severityConfig[log.severity] || severityConfig.INFO
                                const action = actionConfig[log.action] || { bg: 'bg-gray-500', text: 'text-white' }

                                return (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2, delay: index * 0.02 }}
                                        onClick={() => onLogClick(log)}
                                        className="hover:bg-gray-800/30 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-5 py-4 text-sm text-gray-300 font-mono whitespace-nowrap">
                                            {formatTime(log.timestamp)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                {log.type}
                                            </span>
                                            <span className="ml-2 text-xs text-gray-500">{log.category}</span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-300 font-mono">
                                            {log.sourceIP}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-300 font-mono">
                                            {log.destinationIP || '—'}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-cyan-400">
                                            ↓ {((log.downloaded || 0) / 1024).toFixed(1)} KB
                                        </td>
                                        <td className="px-5 py-4 text-sm text-emerald-400">
                                            ↑ {((log.uploaded || 0) / 1024).toFixed(1)} KB
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                                                severity.bg, severity.text, severity.border
                                            )}>
                                                {log.severity}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
                                                action.bg, action.text
                                            )}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors opacity-0 group-hover:opacity-100">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={9} className="px-5 py-16 text-center text-gray-400">
                                    No logs found matching your search
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-700/50">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={cn(
                        'flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        currentPage === 1
                            ? 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                </button>

                <div className="flex items-center space-x-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1
                        if (totalPages > 5 && currentPage > 3) {
                            pageNum = currentPage - 2 + i
                            if (pageNum > totalPages) pageNum = totalPages - 4 + i
                        }
                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={cn(
                                    'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                                    currentPage === pageNum
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                )}
                            >
                                {pageNum}
                            </button>
                        )
                    })}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={cn(
                        'flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        currentPage === totalPages
                            ? 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    )}
                >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    )
}

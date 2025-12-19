'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/dashboard'
import { cn } from '@/lib/utils'

interface ThreatEvent {
    id: string
    timestamp: string
    type: string
    sourceIP: string
    destinationIP: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    status: 'active' | 'resolved' | 'investigating'
    description: string
    confidence: number
}

interface ThreatsStats {
    total: number
    critical: number
    high: number
    active: number
    resolved: number
}

interface PaginationData {
    page: number
    limit: number
    total: number
    totalPages: number
}

const severityColors = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

const statusColors = {
    active: 'bg-red-500 text-white',
    resolved: 'bg-emerald-500 text-white',
    investigating: 'bg-yellow-500 text-black',
}

export default function ThreatEventsPage() {
    const [threats, setThreats] = useState<ThreatEvent[]>([])
    const [stats, setStats] = useState<ThreatsStats>({
        total: 0,
        critical: 0,
        high: 0,
        active: 0,
        resolved: 0
    })
    const [pagination, setPagination] = useState<PaginationData>({
        page: 1,
        limit: 15,
        total: 0,
        totalPages: 0
    })

    // Removed filteredThreats state
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [severityFilter, setSeverityFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const itemsPerPage = 15

    const fetchData = useCallback(async () => {
        try {
            const severityParam = severityFilter !== 'all' ? `&severity=${severityFilter}` : ''
            // Note: Status filter is client-side only for now or ignored as backend doesn't support it fully yet

            const response = await fetch(`/api/threats?page=${currentPage}&limit=${itemsPerPage}${severityParam}`)
            const result = await response.json()

            if (result.success && result.data) {
                const mappedThreats: ThreatEvent[] = result.data.map((t: any) => ({
                    id: t.id,
                    timestamp: t.timestamp,
                    type: t.type,
                    sourceIP: t.sourceIP,
                    destinationIP: t.destinationIP,
                    severity: t.severity,
                    status: 'active', // Default 
                    description: t.description,
                    confidence: Math.round((t.confidence || 0) * 100),
                }))
                setThreats(mappedThreats)

                if (result.stats) setStats(result.stats)
                if (result.pagination) setPagination(result.pagination)
            }
        } catch (error) {
            console.error('Failed to fetch threats:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [currentPage, severityFilter])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Removed client-side effect for filtering

    const handleRefresh = () => {
        setRefreshing(true)
        fetchData()
    }

    const formatDate = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString('tr-TR')
        } catch {
            return timestamp
        }
    }

    const { total, critical, active, resolved } = stats

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Threat Events"
                subtitle="Real-time threat detection and monitoring"
                isLive={true}
                onRefresh={handleRefresh}
                refreshing={refreshing}
            />

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-gray-900/50 border border-gray-700/50"
                >
                    <div className="text-sm text-gray-400 mb-2">Total Threats</div>
                    <div className="text-2xl font-bold text-white">{total.toLocaleString()}</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20"
                >
                    <div className="text-sm text-gray-400 mb-2">Critical</div>
                    <div className="text-2xl font-bold text-red-400">{critical.toLocaleString()}</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/20"
                >
                    <div className="text-sm text-gray-400 mb-2">Active</div>
                    <div className="text-2xl font-bold text-orange-400">{active.toLocaleString()}</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20"
                >
                    <div className="text-sm text-gray-400 mb-2">Resolved</div>
                    <div className="text-2xl font-bold text-emerald-400">
                        {resolved.toLocaleString()}
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">Filters:</span>
                    </div>
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                        <option value="all">All Severities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 cursor-not-allowed opacity-50"
                        disabled
                    >
                        <option value="all">Active Only</option>
                        {/* Status filter disabled as backend assumes all active for now */}
                    </select>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                </button>
            </motion.div>

            {/* Threats Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gray-900/50 rounded-2xl border border-gray-700/50 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="border-b border-gray-700/50 bg-gray-800/30">
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Timestamp</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Type</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Source</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Target</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Severity</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Status</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Confidence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                            {threats.map((threat, index) => (
                                <motion.tr
                                    key={threat.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-5 py-4 text-sm text-gray-300 font-mono whitespace-nowrap">
                                        {formatDate(threat.timestamp)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center space-x-2">
                                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                                            <span className="text-sm text-white">{threat.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-300 font-mono">{threat.sourceIP}</td>
                                    <td className="px-5 py-4 text-sm text-gray-300 font-mono">{threat.destinationIP}</td>
                                    <td className="px-5 py-4">
                                        <span className={cn(
                                            'px-2.5 py-1 rounded-md text-xs font-medium border',
                                            severityColors[threat.severity]
                                        )}>
                                            {threat.severity}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cn(
                                            'px-2.5 py-1 rounded-md text-xs font-medium capitalize',
                                            statusColors[threat.status]
                                        )}>
                                            {threat.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        'h-full rounded-full',
                                                        threat.confidence >= 80 ? 'bg-red-500' :
                                                            threat.confidence >= 60 ? 'bg-orange-500' : 'bg-yellow-500'
                                                    )}
                                                    style={{ width: `${threat.confidence}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-400">{threat.confidence}%</span>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-700/50">
                    <span className="text-sm text-gray-400">
                        Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </span>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={pagination.page === 1}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                pagination.page === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            )}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm text-gray-400">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={pagination.page === pagination.totalPages}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                pagination.page === pagination.totalPages ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            )}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

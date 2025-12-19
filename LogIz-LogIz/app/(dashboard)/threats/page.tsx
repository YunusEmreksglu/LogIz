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
    const [filteredThreats, setFilteredThreats] = useState<ThreatEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [severityFilter, setSeverityFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [totalCount, setTotalCount] = useState(0)
    const itemsPerPage = 15

    const fetchData = useCallback(async () => {
        try {
            // Note: API implementation for threats supports pagination, search, severity.
            // But here we are fetching with a limit of 100 and doing client side filtering? 
            // LogIz-master sets limit=100.
            // I'll stick to that behavior for now but using my API.
            const response = await fetch('/api/threats?limit=100')
            const result = await response.json()

            if (result.success && result.data) {
                const mappedThreats: ThreatEvent[] = result.data.map((t: any) => ({
                    id: t.id,
                    timestamp: t.timestamp,
                    type: t.type,
                    sourceIP: t.source_ip || t.sourceIP, // Handle snake_case from Supabase
                    destinationIP: t.target_ip || t.destinationIP || 'Internal',
                    severity: t.severity,
                    status: 'active', // Default as not in DB
                    description: t.description || 'Threat detected',
                    confidence: Math.round((t.confidence || 0) * 100),
                }))
                setThreats(mappedThreats)
                setFilteredThreats(mappedThreats)
                setTotalCount(mappedThreats.length)
            }
        } catch (error) {
            console.error('Failed to fetch threats:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        let filtered = threats
        if (severityFilter !== 'all') {
            filtered = filtered.filter(t => t.severity === severityFilter)
        }
        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter)
        }
        setFilteredThreats(filtered)
        setCurrentPage(1)
        setTotalCount(filtered.length)
    }, [severityFilter, statusFilter, threats])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchData()
    }

    const totalPages = Math.ceil(filteredThreats.length / itemsPerPage)
    const paginatedThreats = filteredThreats.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const formatDate = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString('tr-TR')
        } catch {
            return timestamp
        }
    }

    // These counts are based on fetched data (limit 100)
    const criticalCount = threats.filter(t => t.severity === 'CRITICAL').length
    const activeCount = threats.filter(t => t.status === 'active').length

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
                    <div className="text-2xl font-bold text-white">{threats.length}</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20"
                >
                    <div className="text-sm text-gray-400 mb-2">Critical</div>
                    <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/20"
                >
                    <div className="text-sm text-gray-400 mb-2">Active</div>
                    <div className="text-2xl font-bold text-orange-400">{activeCount}</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20"
                >
                    <div className="text-sm text-gray-400 mb-2">Resolved</div>
                    <div className="text-2xl font-bold text-emerald-400">
                        {threats.filter(t => t.status === 'resolved').length}
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
                        className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
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
                            {paginatedThreats.map((threat, index) => (
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
                        Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredThreats.length)} of {filteredThreats.length}
                    </span>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                currentPage === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            )}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                currentPage === totalPages ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'
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

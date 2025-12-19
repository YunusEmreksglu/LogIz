'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ShieldOff, Globe, Clock, Ban, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { PageHeader } from '@/components/dashboard'
import { cn } from '@/lib/utils'

interface BlockedStats {
    totalBlocked: number
    uniqueIPs: number
    topCountry: string
    last24h: number
}

interface PaginationData {
    page: number
    limit: number
    total: number
    totalPages: number
}

export default function BlockedTrafficPage() {
    const [blockedData, setBlockedData] = useState<BlockedConnection[]>([])
    const [stats, setStats] = useState<BlockedStats>({
        totalBlocked: 0,
        uniqueIPs: 0,
        topCountry: '—',
        last24h: 0
    })
    const [pagination, setPagination] = useState<PaginationData>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    })

    // Removed filteredData state as we use server-side search
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch(`/api/blocked?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`)
            const result = await response.json()

            if (result.success) {
                setBlockedData(result.data)
                // Use API provided stats and pagination
                if (result.stats) setStats(result.stats)
                if (result.pagination) setPagination(result.pagination)
            }
        } catch (error) {
            console.error('Failed to fetch blocked traffic:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [currentPage, searchQuery])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Removed client-side filtering effect since API handles it

    const handleRefresh = () => {
        setRefreshing(true)
        fetchData()
    }

    const formatTime = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString('tr-TR')
        } catch {
            return timestamp
        }
    }

    const formatTimeAgo = (timestamp: string) => {
        try {
            const diff = Date.now() - new Date(timestamp).getTime()
            const minutes = Math.floor(diff / 60000)
            if (minutes < 60) return `${minutes}m ago`
            const hours = Math.floor(minutes / 60)
            if (hours < 24) return `${hours}h ago`
            return `${Math.floor(hours / 24)}d ago`
        } catch {
            return 'Unknown'
        }
    }

    // Stats variables mapped from state
    const { totalBlocked, uniqueIPs, topCountry, last24h } = stats

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Blocked Traffic"
                subtitle="Firewall blocked connections and threat prevention"
                isLive={true}
                onRefresh={handleRefresh}
                refreshing={refreshing}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <Ban className="w-5 h-5 text-red-400" />
                        </div>
                        <span className="text-sm text-gray-400">Total Blocked</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{totalBlocked.toLocaleString()}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/20"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                            <ShieldOff className="w-5 h-5 text-orange-400" />
                        </div>
                        <span className="text-sm text-gray-400">Unique IPs</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{uniqueIPs.toLocaleString()}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <Globe className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-sm text-gray-400">Top Country</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{topCountry || '—'}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 rounded-lg bg-cyan-500/10">
                            <Clock className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-sm text-gray-400">Last 24h</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {last24h.toLocaleString()}
                    </div>
                </motion.div>
            </div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
            >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by IP, country, reason, or rule..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
            </motion.div>

            {/* Blocked Connections Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gray-900/50 rounded-2xl border border-gray-700/50 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-gray-700/50 bg-gray-800/30">
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Timestamp</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Source IP</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Country</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Port</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Protocol</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Reason</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Rule</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Attempts</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                            {blockedData.map((item, index) => (
                                <motion.tr
                                    key={item.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="px-5 py-4 text-sm text-gray-300 font-mono whitespace-nowrap">
                                        {formatTime(item.timestamp)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center space-x-2">
                                            <Ban className="w-4 h-4 text-red-400" />
                                            <span className="text-sm text-white font-mono">{item.sourceIP}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center space-x-2">
                                            <Globe className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-300">{item.sourceCountry}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-300 font-mono">{item.destinationPort}</td>
                                    <td className="px-5 py-4">
                                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-700 text-gray-300">
                                            {item.protocol}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                            {item.reason}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-cyan-400 font-mono">{item.ruleId}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-sm text-white font-medium">{item.attempts}</span>
                                            <span className="text-xs text-gray-500">{formatTimeAgo(item.lastAttempt)}</span>
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
                        <span className="text-sm text-gray-400">Page {pagination.page} of {pagination.totalPages}</span>
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

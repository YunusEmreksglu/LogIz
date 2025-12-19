'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, FileText, X } from 'lucide-react'
import { PageHeader } from '@/components/dashboard'
import LogTable from '@/components/logs/LogTable'
import LogDetailModal from '@/components/logs/LogDetailModal'

// Types
export interface LogEntry {
    id: string
    timestamp: string
    type: string
    category: string
    sourceIP: string
    sourcePort?: number
    destinationIP?: string
    destinationPort?: number
    protocol?: string
    service?: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
    action: string
    message?: string
    rawLog?: string
    duration?: string
    downloaded?: number
    uploaded?: number
    country?: string
    hostname?: string
    application?: string
    policyId?: string
    policyName?: string
    appRisk?: string
}

export default function LogExplorerPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [refreshing, setRefreshing] = useState(false)
    const logsPerPage = 20

    const fetchLogs = useCallback(async () => {
        try {
            const response = await fetch('/api/threats?limit=100')
            const result = await response.json()

            if (result.success && result.data) {
                const mappedLogs: LogEntry[] = result.data.map((t: any) => ({
                    id: t.id,
                    timestamp: t.timestamp,
                    type: t.type,
                    category: 'Security',
                    sourceIP: t.sourceIP,
                    destinationIP: t.destinationIP,
                    severity: t.severity,
                    action: t.action,
                    message: t.description,
                    rawLog: t.description, // Fallback as API doesn't return rawLog yet
                    country: 'Unknown', // API doesn't return country in this endpoint yet
                }))
                setLogs(mappedLogs)
                setFilteredLogs(mappedLogs)
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredLogs(logs)
        } else {
            const query = searchQuery.toLowerCase()
            setFilteredLogs(logs.filter(log =>
                log.sourceIP.toLowerCase().includes(query) ||
                log.destinationIP?.toLowerCase().includes(query) ||
                log.type.toLowerCase().includes(query) ||
                log.category.toLowerCase().includes(query) ||
                log.application?.toLowerCase().includes(query) ||
                log.message?.toLowerCase().includes(query)
            ))
        }
        setCurrentPage(1)
    }, [searchQuery, logs])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchLogs()
    }

    const totalLogs = filteredLogs.length
    const totalPages = Math.ceil(totalLogs / logsPerPage)
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * logsPerPage,
        currentPage * logsPerPage
    )

    return (
        <div className="p-8 space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Log Explorer"
                subtitle="Browse, filter and analyze raw log entries"
                onRefresh={handleRefresh}
                refreshing={refreshing}
            />

            {/* Search Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
            >
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search logs... (hostname, user, app, category, message, raw log)"
                        className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Total Logs Badge */}
                <div className="absolute right-4 -top-3 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium">
                    {totalLogs.toLocaleString()} total logs
                </div>
            </motion.div>

            {/* Log Table */}
            <LogTable
                logs={paginatedLogs}
                loading={loading}
                onLogClick={(log) => setSelectedLog(log)}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={logsPerPage}
                totalItems={totalLogs}
            />

            {/* Log Detail Modal */}
            {selectedLog && (
                <LogDetailModal
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                    onPrevious={() => {
                        const currentIndex = paginatedLogs.findIndex(l => l.id === selectedLog.id)
                        if (currentIndex > 0) {
                            setSelectedLog(paginatedLogs[currentIndex - 1])
                        }
                    }}
                    onNext={() => {
                        const currentIndex = paginatedLogs.findIndex(l => l.id === selectedLog.id)
                        if (currentIndex < paginatedLogs.length - 1) {
                            setSelectedLog(paginatedLogs[currentIndex + 1])
                        }
                    }}
                />
            )}
        </div>
    )
}

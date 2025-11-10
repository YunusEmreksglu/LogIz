'use client'

import { useEffect, useState } from 'react'
import { formatDate, formatBytes, getThreatColor } from '@/lib/utils'
import { FileText, Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogFileWithAnalysis {
  id: string
  filename: string
  originalName: string
  fileSize: number
  uploadedAt: string
  status: string
  analyses: Array<{
    id: string
    threatCount: number
    status: string
    analyzedAt: string
    threats: Array<{
      severity: string
    }>
  }>
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<LogFileWithAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs')
      const data = await response.json()
      setLogs(data.logFiles)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true
    return log.status.toLowerCase() === filter
  })

  const getSeverityCounts = (analyses: any[]) => {
    if (!analyses || analyses.length === 0) return { critical: 0, high: 0, medium: 0, low: 0 }
    
    const latestAnalysis = analyses[0]
    const threats = latestAnalysis.threats || []
    
    return {
      critical: threats.filter((t: any) => t.severity === 'CRITICAL').length,
      high: threats.filter((t: any) => t.severity === 'HIGH').length,
      medium: threats.filter((t: any) => t.severity === 'MEDIUM').length,
      low: threats.filter((t: any) => t.severity === 'LOW').length,
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analysis History</h1>
          <p className="text-gray-400">View all your previous log analysis results</p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200",
              filter === 'all'
                ? "bg-cyber-blue text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200",
              filter === 'completed'
                ? "bg-cyber-green text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            )}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200",
              filter === 'failed'
                ? "bg-cyber-red text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            )}
          >
            Failed
          </button>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-700">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No log files found</p>
            <p className="text-sm text-gray-500">Upload a log file to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => {
              const severityCounts = getSeverityCounts(log.analyses)
              const hasAnalysis = log.analyses && log.analyses.length > 0
              const latestAnalysis = hasAnalysis ? log.analyses[0] : null

              return (
                <div
                  key={log.id}
                  className="group p-6 rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-700 hover:border-cyber-blue/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-cyber-blue/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-cyber-blue" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-1 truncate">
                          {log.originalName}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(log.uploadedAt)}</span>
                          </div>
                          <div>
                            <span>{formatBytes(log.fileSize)}</span>
                          </div>
                          <div>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              log.status === 'COMPLETED' ? "bg-cyber-green/10 text-cyber-green" :
                              log.status === 'FAILED' ? "bg-cyber-red/10 text-cyber-red" :
                              "bg-gray-700 text-gray-300"
                            )}>
                              {log.status}
                            </span>
                          </div>
                        </div>

                        {hasAnalysis && latestAnalysis && (
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-400">
                                {latestAnalysis.threatCount} threats
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {severityCounts.critical > 0 && (
                                <span className={cn("text-xs px-2 py-1 rounded-full", getThreatColor('CRITICAL'))}>
                                  {severityCounts.critical} Critical
                                </span>
                              )}
                              {severityCounts.high > 0 && (
                                <span className={cn("text-xs px-2 py-1 rounded-full", getThreatColor('HIGH'))}>
                                  {severityCounts.high} High
                                </span>
                              )}
                              {severityCounts.medium > 0 && (
                                <span className={cn("text-xs px-2 py-1 rounded-full", getThreatColor('MEDIUM'))}>
                                  {severityCounts.medium} Medium
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyber-blue group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

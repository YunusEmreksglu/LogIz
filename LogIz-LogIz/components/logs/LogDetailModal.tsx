'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Network, Shield, FileText, Code, Layout } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LogEntry } from '@/app/(dashboard)/logs/page'

interface LogDetailModalProps {
    log: LogEntry
    onClose: () => void
    onPrevious: () => void
    onNext: () => void
}

type TabKey = 'overview' | 'network' | 'security' | 'all' | 'raw'

const tabs: { key: TabKey; label: string; icon: typeof Layout }[] = [
    { key: 'overview', label: 'Overview', icon: Layout },
    { key: 'network', label: 'Network', icon: Network },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'all', label: 'All Fields', icon: FileText },
    { key: 'raw', label: 'Raw Log', icon: Code },
]

const severityConfig = {
    CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    MEDIUM: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    LOW: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    INFO: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
}

export default function LogDetailModal({ log, onClose, onPrevious, onNext }: LogDetailModalProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('overview')
    const severity = severityConfig[log.severity] || severityConfig.INFO

    const formatDate = (timestamp: string) => {
        try {
            const date = new Date(timestamp)
            return date.toLocaleString('en-US', {
                year: 'numeric',
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

    const InfoItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
        <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-sm text-white font-medium">{value || '—'}</div>
        </div>
    )

    const StatBox = ({ label, value }: { label: string; value: string | number }) => (
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</div>
            <div className="text-lg text-white font-bold">{value}</div>
        </div>
    )

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-3xl max-h-[85vh] bg-[#0d1117] rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
                        <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span className="text-lg font-semibold text-white">Log Details</span>
                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {log.type}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-700 text-gray-300">
                                {log.category}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Alert Banner */}
                    <div className="mx-5 mt-5 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-cyan-500/10">
                                <Shield className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-cyan-400">Application Control</div>
                                <div className="text-xs text-gray-400">{log.message}</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-5 gap-3 p-5 border-b border-gray-700/50">
                        <div className="p-3 bg-gray-800/30 rounded-xl">
                            <div className="text-xs text-gray-500 uppercase mb-1">Timestamp</div>
                            <div className="text-sm text-white font-medium">{formatDate(log.timestamp)}</div>
                        </div>
                        <div className="p-3 bg-gray-800/30 rounded-xl">
                            <div className="text-xs text-gray-500 uppercase mb-1">Action</div>
                            <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                log.action === 'Pass' || log.action === 'Passthrough'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-red-500 text-white'
                            )}>
                                {log.action}
                            </span>
                        </div>
                        <div className="p-3 bg-gray-800/30 rounded-xl">
                            <div className="text-xs text-gray-500 uppercase mb-1">Duration</div>
                            <div className="text-sm text-white font-medium">{log.duration}</div>
                        </div>
                        <div className="p-3 bg-gray-800/30 rounded-xl">
                            <div className="text-xs text-gray-500 uppercase mb-1">Downloaded</div>
                            <div className="text-sm text-white font-medium">{log.downloaded || 0} B</div>
                        </div>
                        <div className="p-3 bg-gray-800/30 rounded-xl">
                            <div className="text-xs text-gray-500 uppercase mb-1">Severity</div>
                            <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                                severity.bg, severity.text, severity.border
                            )}>
                                {log.severity}
                            </span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center space-x-1 px-5 pt-4 border-b border-gray-700/50">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    'flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors',
                                    activeTab === tab.key
                                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 border-b-transparent -mb-px'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-5 overflow-y-auto max-h-[300px]">
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-white flex items-center space-x-2">
                                        <span>👤</span>
                                        <span>Identity</span>
                                    </h4>
                                    <div className="space-y-3">
                                        <InfoItem label="User" value="—" />
                                        <InfoItem label="User Group" value="FSSO-High-Group" />
                                        <InfoItem label="Source Name" value="—" />
                                        <InfoItem label="Device Type" value="—" />
                                        <InfoItem label="OS" value="—" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-white flex items-center space-x-2">
                                        <span>📡</span>
                                        <span>Session</span>
                                    </h4>
                                    <div className="space-y-3">
                                        <InfoItem label="Session ID" value={log.id} />
                                        <InfoItem label="Device" value="—" />
                                        <InfoItem label="Virtual Domain" value="root" />
                                        <InfoItem label="Application" value={log.application} />
                                        <InfoItem label="App Category" value="Web.Client" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'network' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-white">↗️ Source</h4>
                                        <div className="space-y-3">
                                            <InfoItem label="IP Address" value={log.sourceIP} />
                                            <InfoItem label="Port" value={log.sourcePort} />
                                            <InfoItem label="Interface" value="Kablo-Local" />
                                            <InfoItem label="Country" value="Reserved" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-white">↘️ Destination</h4>
                                        <div className="space-y-3">
                                            <InfoItem label="IP Address" value={log.destinationIP} />
                                            <InfoItem label="Port" value={log.destinationPort} />
                                            <InfoItem label="Interface" value="port4" />
                                            <InfoItem label="Country" value={log.country} />
                                            <InfoItem label="Hostname" value={log.hostname} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-white">📊 Traffic Metrics</h4>
                                    <div className="grid grid-cols-4 gap-3">
                                        <StatBox label="Sent Bytes" value={`${log.uploaded || 0} B`} />
                                        <StatBox label="Received Bytes" value={`${log.downloaded || 0} B`} />
                                        <StatBox label="Sent Packets" value="0" />
                                        <StatBox label="Received Packets" value="0" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <StatBox label="Protocol" value={log.protocol || 'TCP'} />
                                    <StatBox label="Service" value={log.service || 'SSL'} />
                                    <StatBox label="Duration" value={log.duration || '-'} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-white">🛡️ Policy</h4>
                                    <div className="space-y-3">
                                        <InfoItem label="Policy ID" value={log.policyId} />
                                        <InfoItem label="Policy Name" value={log.policyName} />
                                        <InfoItem label="Action" value={`${log.action} - Traffic passed security inspection`} />
                                        <InfoItem label="Profile" value="—" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-white">⚠️ Threat Info</h4>
                                    <div className="space-y-3">
                                        <InfoItem label="URL" value="/" />
                                        <InfoItem label="Message" value={`Web.Client: ${log.application}`} />
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">App Risk</div>
                                            <span className={cn(
                                                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                                log.appRisk === 'Critical' ? 'bg-red-500/10 text-red-400' :
                                                    log.appRisk === 'High' ? 'bg-orange-500/10 text-orange-400' :
                                                        log.appRisk === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                                            'bg-green-500/10 text-green-400'
                                            )}>
                                                {log.appRisk || 'Low'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'all' && (
                            <div className="grid grid-cols-3 gap-4">
                                {Object.entries(log).map(([key, value]) => (
                                    <InfoItem key={key} label={key} value={String(value)} />
                                ))}
                            </div>
                        )}

                        {activeTab === 'raw' && (
                            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-all">
                                    {log.rawLog || 'No raw log data available'}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-5 border-t border-gray-700/50">
                        <button
                            onClick={onPrevious}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Previous</span>
                        </button>
                        <button
                            onClick={onNext}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
                        >
                            <span>Next</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

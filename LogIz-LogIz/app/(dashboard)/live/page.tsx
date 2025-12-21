'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Activity,
    Pause,
    Play,
    Trash2,
    Shield,
    Server,
    Wifi,
    FileDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface LogEvent {
    id: string
    timestamp: string
    raw: string
    threat_type: string | null
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
    description: string
    source_ip: string | null
    username: string | null
}

const severityConfig = {
    CRITICAL: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]' },
    HIGH: { bg: 'bg-orange-500/10', border: 'border-orange-500/50', text: 'text-orange-400', glow: 'shadow-[0_0_10px_rgba(249,115,22,0.3)]' },
    MEDIUM: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400', glow: '' },
    LOW: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-400', glow: '' },
    INFO: { bg: 'bg-gray-500/10', border: 'border-gray-500/50', text: 'text-gray-400', glow: '' },
}

export default function LiveMonitoringPage() {
    const [logs, setLogs] = useState<LogEvent[]>([])
    const [isStreaming, setIsStreaming] = useState(true)
    const [filter, setFilter] = useState<string>('ALL')
    const [lastTimestamp, setLastTimestamp] = useState<string>('') // Initially empty
    const logsEndRef = useRef<HTMLDivElement>(null)
    const eventSourceRef = useRef<EventSource | null>(null)

    // SSE Connection
    useEffect(() => {
        if (!isStreaming) {
            // Close existing connection when paused
            eventSourceRef.current?.close()
            eventSourceRef.current = null
            return
        }

        const eventSource = new EventSource('/api/live-stream')
        eventSourceRef.current = eventSource

        eventSource.onmessage = (event) => {
            if (event.data === 'connected') return

            try {
                const incoming = JSON.parse(event.data)

                // Detect severity from message if not provided
                const severity = incoming.severity || detectSeverity(incoming.message || incoming.raw || '')

                const newLog: LogEvent = {
                    id: incoming.id || crypto.randomUUID(),
                    timestamp: incoming.timestamp || new Date().toISOString(),
                    raw: incoming.message || incoming.raw || '',
                    threat_type: incoming.threat_type || null,
                    severity: severity,
                    description: incoming.message || incoming.raw || '',
                    source_ip: incoming.ip || incoming.source_ip || incoming.source || null,
                    username: incoming.username || null,
                }

                setLogs(prev => [newLog, ...prev].slice(0, 500))
            } catch (e) {
                console.error('SSE parse error:', e)
            }
        }

        eventSource.onerror = () => {
            console.log('SSE connection error, will retry...')
        }

        return () => {
            eventSource.close()
        }
    }, [isStreaming])

    // Detect severity from log message
    function detectSeverity(message: string): LogEvent['severity'] {
        const lower = message.toLowerCase()
        if (lower.includes('failed password')) return 'HIGH'
        if (lower.includes('root') || lower.includes('uid=0')) return 'CRITICAL'
        if (lower.includes('accepted password')) return 'LOW'
        if (lower.includes('invalid user')) return 'MEDIUM'
        return 'INFO'
    }

    // Auto scroll
    useEffect(() => {
        if (isStreaming) {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isStreaming]);

    const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.severity === filter);

    // Stats calculation
    const stats = {
        total: logs.length,
        critical: logs.filter(l => l.severity === 'CRITICAL').length,
        high: logs.filter(l => l.severity === 'HIGH').length,
        medium: logs.filter(l => l.severity === 'MEDIUM').length,
        low: logs.filter(l => l.severity === 'LOW').length,
        info: logs.filter(l => l.severity === 'INFO').length,
    }

    // PDF Export Function
    const exportToPdf = () => {
        const last200 = logs.slice(0, 200)
        if (last200.length === 0) {
            alert('Dışa aktarılacak log yok!')
            return
        }

        const doc = new jsPDF()

        // Title
        doc.setFontSize(18)
        doc.setTextColor(0, 150, 200)
        doc.text('LogIz - Canlı Log Raporu', 14, 20)

        // Date info
        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`, 14, 30)
        doc.text(`Toplam Log: ${last200.length}`, 14, 36)

        // Stats summary
        doc.setFontSize(12)
        doc.setTextColor(0)
        doc.text('İstatistikler:', 14, 46)
        doc.setFontSize(10)
        doc.text(`• Kritik: ${last200.filter(l => l.severity === 'CRITICAL').length}`, 20, 54)
        doc.text(`• Yüksek: ${last200.filter(l => l.severity === 'HIGH').length}`, 20, 60)
        doc.text(`• Orta: ${last200.filter(l => l.severity === 'MEDIUM').length}`, 20, 66)
        doc.text(`• Düşük: ${last200.filter(l => l.severity === 'LOW').length}`, 20, 72)
        doc.text(`• Bilgi: ${last200.filter(l => l.severity === 'INFO').length}`, 20, 78)

        // Table
        const tableData = last200.map(log => [
            new Date(log.timestamp).toLocaleTimeString('tr-TR'),
            log.severity,
            log.source_ip || '-',
            log.description.substring(0, 50) + (log.description.length > 50 ? '...' : ''),
            log.threat_type || '-'
        ])

        autoTable(doc, {
            startY: 85,
            head: [['Zaman', 'Seviye', 'IP', 'Açıklama', 'Tehdit']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [0, 150, 200] },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 20 },
                2: { cellWidth: 30 },
                3: { cellWidth: 70 },
                4: { cellWidth: 30 }
            }
        })

        doc.save(`logiz-logs-${new Date().toISOString().split('T')[0]}.pdf`)
    }

    return (
        <div className="p-8 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        Canlı Ajan Akışı
                    </h1>
                    <p className="text-sm text-gray-400">Aktif ajanlardan gelen gerçek zamanlı veriler</p>
                </div>

                <div className="flex items-center space-x-3">
                    <div className={cn("px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2", isStreaming ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-red-500/20 text-red-400 border border-red-500/50")}>
                        <Activity className="w-4 h-4" />
                        {isStreaming ? "CANLI" : "DURAKLATILDI"}
                    </div>
                    <button onClick={() => setIsStreaming(!isStreaming)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 border border-gray-700">
                        {isStreaming ? <Pause className="w-4 h-4 text-yellow-400" /> : <Play className="w-4 h-4 text-green-400" />}
                    </button>
                    <button onClick={() => setLogs([])} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 border border-gray-700" title='Temizle'>
                        <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                    <button
                        onClick={exportToPdf}
                        disabled={logs.length === 0}
                        className="p-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg hover:from-cyan-500 hover:to-blue-500 border border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title='Son 200 Logu PDF Olarak İndir'
                    >
                        <FileDown className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-6 gap-4 shrink-0">
                {Object.entries(stats).map(([k, v]) => (
                    <div key={k} className="bg-gray-900/50 p-3 rounded-xl border border-gray-800 text-center hover:bg-gray-800/50 transition-colors">
                        <div className="text-xs text-gray-500 uppercase flex justify-center items-center gap-1">
                            {k === 'critical' && <Shield className="w-3 h-3 text-red-500" />}
                            {k}
                        </div>
                        <div className={cn("text-xl font-bold mt-1",
                            k === 'critical' ? 'text-red-400' :
                                k === 'high' ? 'text-orange-400' :
                                    k === 'info' ? 'text-gray-400' : 'text-white'
                        )}>{v}</div>
                    </div>
                ))}
            </div>

            {/* Logs List */}
            <div className="flex-1 bg-black/40 rounded-2xl border border-gray-800 overflow-hidden flex flex-col relative shadow-inner">
                <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/80 backdrop-blur">
                    <div className="flex gap-2">
                        {['ALL', 'CRITICAL', 'HIGH', 'INFO'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1 text-xs rounded-lg transition-colors border", filter === f ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50" : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800")}>
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Server className="w-3 h-3" />
                        <span>SSE Bağlantısı</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm scrollbar-thin scrollbar-thumb-gray-800">
                    <AnimatePresence>
                        {filteredLogs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn("p-3 rounded-lg border-l-4 bg-gray-900/40 hover:bg-gray-800/60 transition-colors group", severityConfig[log.severity]?.border || 'border-gray-500')}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider", severityConfig[log.severity]?.bg, severityConfig[log.severity]?.text)}>
                                            {log.severity}
                                        </span>
                                        <span className="text-gray-500 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        {log.source_ip && (
                                            <span className="flex items-center gap-1 text-cyan-400/80 text-xs bg-cyan-900/20 px-1.5 py-0.5 rounded">
                                                <Wifi className="w-3 h-3" />
                                                {log.source_ip}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-700 group-hover:text-gray-500 transition-colors">#{log.id.slice(0, 8)}</span>
                                </div>
                                <div className="mt-1.5 text-gray-300">
                                    {log.description}
                                    {log.threat_type && <span className="ml-2 text-red-400 font-bold bg-red-900/10 px-1 rounded">[{log.threat_type}]</span>}
                                </div>
                                <div className="mt-1 text-xs text-gray-600 truncate opacity-60 group-hover:opacity-100 transition-opacity">
                                    {log.raw}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredLogs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                            <Activity className="w-12 h-12 mb-4 opacity-20" />
                            <p>Henüz veri yok...</p>
                            <p className="text-xs mt-2">Ajanlarınızdan log bekleniyor</p>
                        </div>
                    )}

                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    )
}

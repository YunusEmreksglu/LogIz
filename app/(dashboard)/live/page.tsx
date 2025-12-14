'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Radio,
    Pause,
    Play,
    Trash2,
    Download,
    Filter,
    AlertTriangle,
    Shield,
    Activity,
    Wifi,
    WifiOff,
    Server,
    Key,
    User,
    Lock,
    Terminal,
    X,
    Check,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogEvent {
    id: string
    timestamp: Date
    raw: string
    threat_type: string | null
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
    description: string
    source_ip: string | null
    username: string | null
}

interface SSHConnection {
    host: string
    port: number
    username: string
    password: string
    logPath: string
}

const severityConfig = {
    CRITICAL: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/50',
        text: 'text-red-400',
        glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]'
    },
    HIGH: {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/50',
        text: 'text-orange-400',
        glow: 'shadow-[0_0_10px_rgba(249,115,22,0.3)]'
    },
    MEDIUM: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        glow: ''
    },
    LOW: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        glow: ''
    },
    INFO: {
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/50',
        text: 'text-gray-400',
        glow: ''
    },
}

export default function LiveMonitoringPage() {
    const [logs, setLogs] = useState<LogEvent[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [filter, setFilter] = useState<LogEvent['severity'] | 'ALL'>('ALL')
    const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 })
    const [error, setError] = useState<string | null>(null)
    const [showConnectionForm, setShowConnectionForm] = useState(true)

    const logsContainerRef = useRef<HTMLDivElement>(null)
    const eventSourceRef = useRef<EventSource | null>(null)

    const [connection, setConnection] = useState<SSHConnection>({
        host: '192.168.154.1',
        port: 22,
        username: 'demo',
        password: '',
        logPath: '/var/log/auth.log'
    })

    // Connect to SSH
    const handleConnect = async () => {
        setIsConnecting(true)
        setError(null)

        try {
            const response = await fetch('/api/ssh/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    host: connection.host,
                    port: connection.port,
                    username: connection.username,
                    password: connection.password
                })
            })

            const data = await response.json()

            if (data.success) {
                setIsConnected(true)
                setShowConnectionForm(false)
                startStreaming()
            } else {
                setError(data.error || 'Bağlantı başarısız')
            }
        } catch (err: any) {
            setError(err.message || 'Bağlantı hatası')
        } finally {
            setIsConnecting(false)
        }
    }

    // Start SSE streaming
    const startStreaming = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
        }

        const url = `http://127.0.0.1:5000/api/ssh/stream?log_path=${encodeURIComponent(connection.logPath)}`
        const eventSource = new EventSource(url)
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
            setIsStreaming(true)
            setError(null)
        }

        eventSource.onmessage = (event) => {
            try {
                const logEntry = JSON.parse(event.data)

                if (logEntry.error) {
                    setError(logEntry.error)
                    return
                }

                const newLog: LogEvent = {
                    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date(),
                    raw: logEntry.raw || '',
                    threat_type: logEntry.threat_type,
                    severity: logEntry.severity || 'INFO',
                    description: logEntry.description || logEntry.raw,
                    source_ip: logEntry.source_ip,
                    username: logEntry.username
                }

                setLogs(prev => [newLog, ...prev].slice(0, 500))

                // Update stats
                setStats(prev => ({
                    total: prev.total + 1,
                    critical: prev.critical + (newLog.severity === 'CRITICAL' ? 1 : 0),
                    high: prev.high + (newLog.severity === 'HIGH' ? 1 : 0),
                    medium: prev.medium + (newLog.severity === 'MEDIUM' ? 1 : 0),
                    low: prev.low + (newLog.severity === 'LOW' ? 1 : 0),
                    info: prev.info + (newLog.severity === 'INFO' ? 1 : 0),
                }))
            } catch (e) {
                console.error('Parse error:', e)
            }
        }

        eventSource.onerror = () => {
            setIsStreaming(false)
            setError('Stream bağlantısı kesildi')
        }
    }

    // Disconnect
    const handleDisconnect = async () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }

        try {
            await fetch('/api/ssh/disconnect', { method: 'POST' })
        } catch (e) {
            console.error('Disconnect error:', e)
        }

        setIsConnected(false)
        setIsStreaming(false)
        setShowConnectionForm(true)
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }
        }
    }, [])

    // Auto-scroll
    useEffect(() => {
        if (isStreaming && logsContainerRef.current) {
            logsContainerRef.current.scrollTop = 0
        }
    }, [logs, isStreaming])

    const filteredLogs = filter === 'ALL'
        ? logs
        : logs.filter(log => log.severity === filter)

    const clearLogs = () => {
        setLogs([])
        setStats({ total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 })
    }

    const exportLogs = () => {
        const data = JSON.stringify(logs, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ssh-logs-${new Date().toISOString()}.json`
        a.click()
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
                        <Radio className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Canlı Log İzleme</h1>
                        <p className="text-sm text-gray-400">SSH üzerinden gerçek zamanlı güvenlik olayları</p>
                    </div>

                    {/* Connection Status */}
                    <div className={cn(
                        "flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium",
                        isConnected && isStreaming
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : isConnected
                                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                                : "bg-red-500/10 text-red-400 border border-red-500/30"
                    )}>
                        {isConnected && isStreaming ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <Wifi className="w-4 h-4" />
                                <span>CANLI</span>
                            </>
                        ) : isConnected ? (
                            <>
                                <Server className="w-4 h-4" />
                                <span>BAĞLI</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4" />
                                <span>BAĞLANTI YOK</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-3">
                    {isConnected ? (
                        <>
                            <button
                                onClick={() => isStreaming ? eventSourceRef.current?.close() : startStreaming()}
                                className={cn(
                                    "flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                    isStreaming
                                        ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30"
                                        : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                                )}
                            >
                                {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                <span>{isStreaming ? 'Duraklat' : 'Devam Et'}</span>
                            </button>
                            <button
                                onClick={handleDisconnect}
                                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all border border-red-500/30"
                            >
                                <X className="w-4 h-4" />
                                <span>Bağlantıyı Kes</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setShowConnectionForm(true)}
                            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-sm font-medium transition-all border border-cyan-500/30"
                        >
                            <Server className="w-4 h-4" />
                            <span>Sunucuya Bağlan</span>
                        </button>
                    )}
                    <button
                        onClick={clearLogs}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 text-sm font-medium transition-all border border-gray-700/50"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Temizle</span>
                    </button>
                    <button
                        onClick={exportLogs}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-sm font-medium transition-all border border-cyan-500/30"
                    >
                        <Download className="w-4 h-4" />
                        <span>Dışa Aktar</span>
                    </button>
                </div>
            </div>

            {/* Connection Form Modal */}
            <AnimatePresence>
                {showConnectionForm && !isConnected && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-6 rounded-2xl bg-gray-900/80 border border-cyan-500/30 backdrop-blur-sm"
                    >
                        <div className="flex items-center space-x-3 mb-6">
                            <Terminal className="w-6 h-6 text-cyan-400" />
                            <h3 className="text-lg font-semibold text-white">SSH Bağlantısı</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    <Server className="w-4 h-4 inline mr-2" />
                                    Host
                                </label>
                                <input
                                    type="text"
                                    value={connection.host}
                                    onChange={(e) => setConnection({ ...connection, host: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-cyan-500 focus:outline-none"
                                    placeholder="192.168.1.1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    <Key className="w-4 h-4 inline mr-2" />
                                    Port
                                </label>
                                <input
                                    type="number"
                                    value={connection.port}
                                    onChange={(e) => setConnection({ ...connection, port: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Kullanıcı
                                </label>
                                <input
                                    type="text"
                                    value={connection.username}
                                    onChange={(e) => setConnection({ ...connection, username: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-cyan-500 focus:outline-none"
                                    placeholder="root"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    <Lock className="w-4 h-4 inline mr-2" />
                                    Şifre
                                </label>
                                <input
                                    type="password"
                                    value={connection.password}
                                    onChange={(e) => setConnection({ ...connection, password: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">
                                <Terminal className="w-4 h-4 inline mr-2" />
                                Log Dosyası Yolu
                            </label>
                            <input
                                type="text"
                                value={connection.logPath}
                                onChange={(e) => setConnection({ ...connection, logPath: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-cyan-500 focus:outline-none"
                                placeholder="/var/log/auth.log"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleConnect}
                            disabled={isConnecting || !connection.host || !connection.username}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Bağlanıyor...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    <span>Bağlan</span>
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <motion.div
                    animate={{ scale: stats.total > 0 ? [1, 1.02, 1] : 1 }}
                    className="p-4 rounded-xl bg-gray-900/50 border border-gray-700/50"
                >
                    <div className="flex items-center space-x-2 mb-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400 uppercase">Toplam</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </motion.div>

                {[
                    { key: 'critical', label: 'Kritik', color: 'red', count: stats.critical },
                    { key: 'high', label: 'Yüksek', color: 'orange', count: stats.high },
                    { key: 'medium', label: 'Orta', color: 'yellow', count: stats.medium },
                    { key: 'low', label: 'Düşük', color: 'blue', count: stats.low },
                    { key: 'info', label: 'Bilgi', color: 'gray', count: stats.info },
                ].map(item => (
                    <motion.div
                        key={item.key}
                        animate={{ scale: item.count > 0 ? [1, 1.02, 1] : 1 }}
                        className={cn(
                            "p-4 rounded-xl border cursor-pointer transition-all",
                            filter === item.key.toUpperCase()
                                ? `bg-${item.color}-500/20 border-${item.color}-500/50`
                                : "bg-gray-900/50 border-gray-700/50 hover:border-gray-600/50"
                        )}
                        onClick={() => setFilter(filter === item.key.toUpperCase() as any ? 'ALL' : item.key.toUpperCase() as any)}
                    >
                        <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className={`w-4 h-4 text-${item.color}-400`} />
                            <span className="text-xs text-gray-400 uppercase">{item.label}</span>
                        </div>
                        <p className={`text-2xl font-bold text-${item.color}-400`}>{item.count}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Filtre:</span>
                <div className="flex space-x-2">
                    {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                                filter === f
                                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border border-gray-700/50"
                            )}
                        >
                            {f === 'ALL' ? 'Tümü' : f}
                        </button>
                    ))}
                </div>
                <span className="text-sm text-gray-500">({filteredLogs.length} kayıt)</span>
            </div>

            {/* Logs Container */}
            <div
                ref={logsContainerRef}
                className="h-[500px] overflow-y-auto rounded-2xl bg-gray-900/50 border border-gray-700/50 p-4 space-y-2"
            >
                <AnimatePresence initial={false}>
                    {filteredLogs.map((log) => {
                        const config = severityConfig[log.severity]
                        return (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "p-4 rounded-xl border-l-4 transition-all",
                                    config.bg,
                                    config.border,
                                    config.glow
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold",
                                                config.bg, config.text
                                            )}>
                                                {log.severity}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {log.timestamp.toLocaleTimeString('tr-TR')}
                                            </span>
                                            {log.threat_type && (
                                                <span className="px-2 py-0.5 rounded bg-gray-800 text-xs text-gray-400">
                                                    {log.threat_type}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-white mb-2">{log.description}</p>
                                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                                            {log.source_ip && (
                                                <span>
                                                    <span className="text-gray-500">IP:</span> {log.source_ip}
                                                </span>
                                            )}
                                            {log.username && (
                                                <span>
                                                    <span className="text-gray-500">Kullanıcı:</span> {log.username}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2 font-mono truncate">{log.raw}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {filteredLogs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Shield className="w-12 h-12 text-gray-600 mb-4" />
                        <p className="text-gray-400">
                            {isConnected ? 'Log bekleniyor...' : 'SSH bağlantısı yapılmadı'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {isConnected
                                ? 'Sunucudan log satırları geldiğinde burada görünecek'
                                : 'Yukarıdaki formu kullanarak sunucunuza bağlanın'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

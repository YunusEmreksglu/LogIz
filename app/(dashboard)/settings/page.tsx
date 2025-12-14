'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Settings,
    Database,
    Server,
    Shield,
    Globe,
    Save,
    TestTube,
    CheckCircle,
    XCircle,
    Loader2,
    Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConnectionConfig {
    // Database
    databaseUrl: string
    // Python API
    pythonApiUrl: string
    pythonApiKey: string
    // Firewall (optional)
    firewallEnabled: boolean
    firewallType: 'fortigate' | 'paloalto' | 'pfsense' | 'other'
    firewallHost: string
    firewallApiKey: string
    // IDS/IPS (optional)
    idsEnabled: boolean
    idsType: 'suricata' | 'snort' | 'other'
    idsHost: string
}

const defaultConfig: ConnectionConfig = {
    databaseUrl: '',
    pythonApiUrl: 'http://localhost:5000',
    pythonApiKey: '',
    firewallEnabled: false,
    firewallType: 'fortigate',
    firewallHost: '',
    firewallApiKey: '',
    idsEnabled: false,
    idsType: 'suricata',
    idsHost: '',
}

export default function SettingsPage() {
    const [config, setConfig] = useState<ConnectionConfig>(defaultConfig)
    const [isSaving, setIsSaving] = useState(false)
    const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'loading' | null>>({
        database: null,
        pythonApi: null,
        firewall: null,
        ids: null,
    })
    const [savedMessage, setSavedMessage] = useState(false)

    // Load saved config
    useEffect(() => {
        const saved = localStorage.getItem('logiz-settings')
        if (saved) {
            try {
                setConfig(JSON.parse(saved))
            } catch { }
        }
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        // Save to localStorage (in production, save to database)
        localStorage.setItem('logiz-settings', JSON.stringify(config))

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        setIsSaving(false)
        setSavedMessage(true)
        setTimeout(() => setSavedMessage(false), 3000)
    }

    const testConnection = async (type: 'database' | 'pythonApi' | 'firewall' | 'ids') => {
        setTestResults(prev => ({ ...prev, [type]: 'loading' }))

        // Simulate connection test
        await new Promise(resolve => setTimeout(resolve, 1500))

        // For demo, Python API test checks if it's running on localhost:5000
        if (type === 'pythonApi') {
            try {
                const response = await fetch(`${config.pythonApiUrl}/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000)
                })
                if (response.ok) {
                    setTestResults(prev => ({ ...prev, [type]: 'success' }))
                    return
                }
            } catch { }
            setTestResults(prev => ({ ...prev, [type]: 'error' }))
            return
        }

        // Other connections - simulate random success/failure
        const success = Math.random() > 0.3
        setTestResults(prev => ({ ...prev, [type]: success ? 'success' : 'error' }))
    }

    const TestButton = ({ type }: { type: 'database' | 'pythonApi' | 'firewall' | 'ids' }) => {
        const result = testResults[type]
        return (
            <button
                onClick={() => testConnection(type)}
                disabled={result === 'loading'}
                className={cn(
                    "flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    result === 'success' && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                    result === 'error' && "bg-red-500/20 text-red-400 border border-red-500/30",
                    result === 'loading' && "bg-gray-700/50 text-gray-400 border border-gray-600/50",
                    result === null && "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20"
                )}
            >
                {result === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                {result === 'success' && <CheckCircle className="w-4 h-4" />}
                {result === 'error' && <XCircle className="w-4 h-4" />}
                {result === null && <TestTube className="w-4 h-4" />}
                <span>
                    {result === 'loading' ? 'Test Ediliyor...' :
                        result === 'success' ? 'Bağlandı' :
                            result === 'error' ? 'Başarısız' : 'Bağlantıyı Test Et'}
                </span>
            </button>
        )
    }

    return (
        <div className="p-8 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                        <Settings className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
                        <p className="text-sm text-gray-400">Bağlantı ve sistem ayarları</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        savedMessage
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/20"
                    )}
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : savedMessage ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    <span>{savedMessage ? 'Kaydedildi!' : 'Kaydet'}</span>
                </button>
            </div>

            {/* Info banner */}
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                    <p className="text-sm text-blue-400">
                        Bu sayfa üzerinden sunucu bağlantılarınızı yapılandırabilirsiniz.
                        Kod değişikliği yapmanıza gerek yoktur.
                    </p>
                </div>
            </div>

            {/* Python ML API */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-gray-900/50 border border-gray-700/50"
            >
                <div className="flex items-center space-x-3 mb-6">
                    <Server className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-semibold text-white">Python ML API</h2>
                    <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">Gerekli</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">API URL</label>
                        <input
                            type="text"
                            value={config.pythonApiUrl}
                            onChange={(e) => setConfig({ ...config, pythonApiUrl: e.target.value })}
                            placeholder="http://localhost:5000"
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">API Key (opsiyonel)</label>
                        <input
                            type="password"
                            value={config.pythonApiKey}
                            onChange={(e) => setConfig({ ...config, pythonApiKey: e.target.value })}
                            placeholder="••••••••••"
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <TestButton type="pythonApi" />
                </div>
            </motion.div>

            {/* Database */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-2xl bg-gray-900/50 border border-gray-700/50"
            >
                <div className="flex items-center space-x-3 mb-6">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-semibold text-white">Veritabanı</h2>
                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">Gerekli</span>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-2">PostgreSQL Bağlantı URL</label>
                    <input
                        type="text"
                        value={config.databaseUrl}
                        onChange={(e) => setConfig({ ...config, databaseUrl: e.target.value })}
                        placeholder="postgresql://user:password@host:5432/database"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                    />
                </div>

                <div className="mt-4">
                    <TestButton type="database" />
                </div>
            </motion.div>

            {/* Firewall Integration */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-gray-900/50 border border-gray-700/50"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-orange-400" />
                        <h2 className="text-lg font-semibold text-white">Firewall Entegrasyonu</h2>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-500/20 text-gray-400">Opsiyonel</span>
                    </div>
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={config.firewallEnabled}
                                onChange={(e) => setConfig({ ...config, firewallEnabled: e.target.checked })}
                                className="sr-only"
                            />
                            <div className={cn(
                                "w-11 h-6 rounded-full transition-colors",
                                config.firewallEnabled ? "bg-cyan-500" : "bg-gray-700"
                            )} />
                            <div className={cn(
                                "absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                config.firewallEnabled && "translate-x-5"
                            )} />
                        </div>
                    </label>
                </div>

                {config.firewallEnabled && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Firewall Türü</label>
                                <select
                                    value={config.firewallType}
                                    onChange={(e) => setConfig({ ...config, firewallType: e.target.value as any })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white focus:outline-none focus:border-orange-500/50"
                                >
                                    <option value="fortigate">FortiGate</option>
                                    <option value="paloalto">Palo Alto</option>
                                    <option value="pfsense">pfSense</option>
                                    <option value="other">Diğer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Host/IP</label>
                                <input
                                    type="text"
                                    value={config.firewallHost}
                                    onChange={(e) => setConfig({ ...config, firewallHost: e.target.value })}
                                    placeholder="192.168.1.1"
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">API Key</label>
                                <input
                                    type="password"
                                    value={config.firewallApiKey}
                                    onChange={(e) => setConfig({ ...config, firewallApiKey: e.target.value })}
                                    placeholder="••••••••••"
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                                />
                            </div>
                        </div>
                        <TestButton type="firewall" />
                    </div>
                )}
            </motion.div>

            {/* IDS/IPS Integration */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-gray-900/50 border border-gray-700/50"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">IDS/IPS Entegrasyonu</h2>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-500/20 text-gray-400">Opsiyonel</span>
                    </div>
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={config.idsEnabled}
                                onChange={(e) => setConfig({ ...config, idsEnabled: e.target.checked })}
                                className="sr-only"
                            />
                            <div className={cn(
                                "w-11 h-6 rounded-full transition-colors",
                                config.idsEnabled ? "bg-cyan-500" : "bg-gray-700"
                            )} />
                            <div className={cn(
                                "absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                config.idsEnabled && "translate-x-5"
                            )} />
                        </div>
                    </label>
                </div>

                {config.idsEnabled && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">IDS Türü</label>
                                <select
                                    value={config.idsType}
                                    onChange={(e) => setConfig({ ...config, idsType: e.target.value as any })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white focus:outline-none focus:border-purple-500/50"
                                >
                                    <option value="suricata">Suricata</option>
                                    <option value="snort">Snort</option>
                                    <option value="other">Diğer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Host/IP</label>
                                <input
                                    type="text"
                                    value={config.idsHost}
                                    onChange={(e) => setConfig({ ...config, idsHost: e.target.value })}
                                    placeholder="192.168.1.10"
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                                />
                            </div>
                        </div>
                        <TestButton type="ids" />
                    </div>
                )}
            </motion.div>
        </div>
    )
}

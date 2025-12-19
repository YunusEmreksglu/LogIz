'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Bug, Shield, AlertTriangle, TrendingUp, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/dashboard'
import { cn } from '@/lib/utils'

// Attack types with detailed info (Static data for definitions)
const attackTypes = [
    {
        id: 'dos',
        name: 'DoS (Denial of Service)',
        category: 'Availability',
        severity: 'CRITICAL',
        description: 'Attacks designed to make a machine or network resource unavailable',
        techniques: ['SYN Flood', 'UDP Flood', 'ICMP Flood', 'Slowloris'],
        mitigations: ['Rate limiting', 'Traffic filtering', 'Load balancing'],
    },
    {
        id: 'exploits',
        name: 'Exploits',
        category: 'Exploitation',
        severity: 'CRITICAL',
        description: 'Attacks that take advantage of software vulnerabilities',
        techniques: ['Buffer Overflow', 'SQL Injection', 'Remote Code Execution'],
        mitigations: ['Patch management', 'Input validation', 'WAF'],
    },
    {
        id: 'reconnaissance',
        name: 'Reconnaissance',
        category: 'Information Gathering',
        severity: 'HIGH',
        description: 'Scanning and probing to gather information about targets',
        techniques: ['Port Scanning', 'Network Mapping', 'OS Fingerprinting'],
        mitigations: ['IDS/IPS', 'Firewall rules', 'Honeypots'],
    },
    {
        id: 'backdoor',
        name: 'Backdoor',
        category: 'Persistence',
        severity: 'CRITICAL',
        description: 'Covert methods to bypass normal authentication',
        techniques: ['Web Shell', 'RAT', 'Rootkit'],
        mitigations: ['Endpoint protection', 'File integrity monitoring', 'Network segmentation'],
    },
    {
        id: 'shellcode',
        name: 'Shellcode',
        category: 'Execution',
        severity: 'CRITICAL',
        description: 'Small piece of code used as payload in exploitation',
        techniques: ['Reverse Shell', 'Bind Shell', 'Staged Payloads'],
        mitigations: ['DEP', 'ASLR', 'Code signing'],
    },
    {
        id: 'worms',
        name: 'Worms',
        category: 'Propagation',
        severity: 'CRITICAL',
        description: 'Self-replicating malware that spreads across networks',
        techniques: ['Network Propagation', 'Email Spreading', 'USB Spreading'],
        mitigations: ['Network isolation', 'Antivirus', 'Email filtering'],
    },
    {
        id: 'fuzzers',
        name: 'Fuzzers',
        category: 'Testing/Attack',
        severity: 'MEDIUM',
        description: 'Automated testing using random or malformed data',
        techniques: ['Protocol Fuzzing', 'File Format Fuzzing', 'API Fuzzing'],
        mitigations: ['Input validation', 'Crash monitoring', 'Sandboxing'],
    },
    {
        id: 'generic',
        name: 'Generic',
        category: 'General',
        severity: 'MEDIUM',
        description: 'General attack patterns not fitting specific categories',
        techniques: ['Brute Force', 'Dictionary Attack', 'Credential Stuffing'],
        mitigations: ['Account lockout', 'MFA', 'CAPTCHA'],
    },
    {
        id: 'analysis',
        name: 'Analysis',
        category: 'Intelligence',
        severity: 'LOW',
        description: 'Traffic analysis and information gathering',
        techniques: ['Packet Sniffing', 'Traffic Analysis', 'Timing Analysis'],
        mitigations: ['Encryption', 'Traffic padding', 'VPN'],
    },
]

interface AttackTypeStats {
    id: string
    count: number
    lastSeen: string
    trend: number
    blocked: number
}

const severityColors = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

export default function AttackTypesPage() {
    const [stats, setStats] = useState<Map<string, AttackTypeStats>>(new Map())
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [expandedType, setExpandedType] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch('/api/attack-types/stats')
            const result = await response.json()

            if (result.success && result.data) {
                // Convert API data to Map format
                const statsMap = new Map<string, AttackTypeStats>()
                // The API returns an array object with user friendly keys, or map?
                // Based on API implementation: data is array of metadata, stats is the counts.
                // Actually my API implementation returned { success: true, data: attackTypes, stats: { type: count } } or similar.
                // Let's re-verify API response structure from my previous work.
                // In `app/api/attack-types/stats/route.ts`:
                // return NextResponse.json({ success: true, data: attackTypes, stats: ... }) where stats is aggregation.
                // But looking at logiz-master code it expects result.data to be an array and iterates it?
                // Wait, LogIz-master code:
                // result.data.forEach((item: any) => { statsMap.set(item.id, ... ) })
                // My API implementation might be slightly different.
                // The API I wrote:
                // const attackTypesWithStats = attackTypes.map(type => ({ ...type, count: ..., blocked: ... }))
                // return NextResponse.json({ success: true, data: attackTypesWithStats })
                // Yes, I did that. So it matches.

                result.data.forEach((item: any) => {
                    statsMap.set(item.id, {
                        id: item.id,
                        count: item.count || 0,
                        lastSeen: item.lastSeen || new Date().toISOString(),
                        trend: item.trend || 0,
                        blocked: item.blocked || 0,
                    })
                })
                setStats(statsMap)
            }
        } catch (error) {
            console.error('Failed to fetch attack types:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchData()
    }

    const totalAttacks = Array.from(stats.values()).reduce((sum, s) => sum + s.count, 0)
    const totalBlocked = Array.from(stats.values()).reduce((sum, s) => sum + s.blocked, 0)

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Attack Types"
                subtitle="Detailed attack type analysis and mitigation strategies"
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
                    <div className="flex items-center space-x-3 mb-3">
                        <Bug className="w-5 h-5 text-red-400" />
                        <span className="text-sm text-gray-400">Attack Types</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{attackTypes.length}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="p-5 rounded-2xl bg-gray-900/50 border border-gray-700/50"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                        <span className="text-sm text-gray-400">Total Attacks</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{totalAttacks.toLocaleString()}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 rounded-2xl bg-gray-900/50 border border-gray-700/50"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-gray-400">Blocked</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{totalBlocked.toLocaleString()}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-5 rounded-2xl bg-gray-900/50 border border-gray-700/50"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm text-gray-400">Critical Types</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {attackTypes.filter(t => t.severity === 'CRITICAL').length}
                    </div>
                </motion.div>
            </div>

            {/* Attack Types Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {attackTypes.map((type, index) => {
                    const typeStats = stats.get(type.id)
                    const isExpanded = expandedType === type.id

                    return (
                        <motion.div
                            key={type.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                'rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden',
                                'bg-gray-900/50 border-gray-700/50 hover:border-gray-600/50'
                            )}
                            onClick={() => setExpandedType(isExpanded ? null : type.id)}
                        >
                            {/* Header */}
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 rounded-lg bg-red-500/10">
                                            <Bug className="w-5 h-5 text-red-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{type.name}</h3>
                                            <span className="text-xs text-gray-500">{type.category}</span>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        'px-2.5 py-1 rounded-md text-xs font-medium border',
                                        severityColors[type.severity as keyof typeof severityColors]
                                    )}>
                                        {type.severity}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-400 mb-4">{type.description}</p>

                                {/* Stats Row */}
                                <div className="flex items-center space-x-6 text-sm">
                                    <div>
                                        <span className="text-gray-500">Count:</span>
                                        <span className="ml-2 text-white font-medium">
                                            {typeStats?.count.toLocaleString() || 0}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Blocked:</span>
                                        <span className="ml-2 text-emerald-400 font-medium">
                                            {typeStats?.blocked.toLocaleString() || 0}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Trend:</span>
                                        <span className={cn(
                                            'ml-2 font-medium',
                                            (typeStats?.trend || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                                        )}>
                                            {(typeStats?.trend || 0) > 0 ? '+' : ''}{typeStats?.trend || 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="border-t border-gray-700/50 p-5 bg-gray-800/20"
                                >
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-400 mb-3">Techniques</h4>
                                            <ul className="space-y-2">
                                                {type.techniques.map(tech => (
                                                    <li key={tech} className="flex items-center space-x-2 text-sm text-gray-300">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                        <span>{tech}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-400 mb-3">Mitigations</h4>
                                            <ul className="space-y-2">
                                                {type.mitigations.map(mit => (
                                                    <li key={mit} className="flex items-center space-x-2 text-sm text-gray-300">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        <span>{mit}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

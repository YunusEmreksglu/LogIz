'use client'

import { memo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieChartIcon, Loader2 } from 'lucide-react'

interface ThreatCategory {
    name: string
    value: number
    color: string
    [key: string]: string | number
}

interface ThreatDonutChartProps {
    data?: ThreatCategory[]
    title?: string
}

// Tehdit türleri için renkler
const threatColors: Record<string, string> = {
    'Normal': '#22c55e',
    'Exploits': '#ef4444',
    'Reconnaissance': '#f59e0b',
    'DoS': '#dc2626',
    'Generic': '#8b5cf6',
    'Shellcode': '#ec4899',
    'Fuzzers': '#06b6d4',
    'Worms': '#f43f5e',
    'Backdoor': '#7c3aed',
    'Analysis': '#0ea5e9',
}

export default memo(function ThreatDonutChart({ data, title = "Tehdit Dağılımı" }: ThreatDonutChartProps) {
    const [chartData, setChartData] = useState<ThreatCategory[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Eğer data prop'u verilmişse onu kullan
        if (data && data.length > 0) {
            setChartData(data)
            setLoading(false)
            return
        }

        // Yoksa API'den al
        const fetchData = async () => {
            try {
                const response = await fetch('/api/categories/stats')
                const result = await response.json()

                if (result.success && result.data) {
                    // Sadece count > 0 olanları al
                    const filtered = result.data
                        .filter((d: any) => d.count > 0)
                        .map((d: any) => ({
                            name: d.name,
                            value: d.count,
                            color: d.color || threatColors[d.name] || '#6366f1'
                        }))

                    setChartData(filtered)
                }
            } catch (error) {
                console.error('Failed to fetch threat distribution:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [data])

    const total = chartData.reduce((sum, item) => sum + item.value, 0)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
        >
            {/* Header */}
            <div className="flex items-center space-x-2 mb-6">
                <PieChartIcon className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
            ) : chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                    <PieChartIcon className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm">Henüz veri bulunmuyor</p>
                    <p className="text-gray-500 text-xs">Dosya yükleyip analiz edin</p>
                </div>
            ) : (
                <div className="flex items-center">
                    {/* Donut Chart */}
                    <div className="relative w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                    }}
                                    formatter={(value: number) => [`${value.toLocaleString()} olay`, 'Sayı']}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-sm text-gray-400">Toplam</span>
                            <span className="text-2xl font-bold text-white">{total.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 ml-6 space-y-2">
                        {chartData.map((item, index) => (
                            <motion.div
                                key={item.name}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-2">
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-gray-300">{item.name}</span>
                                </div>
                                <span className="text-sm text-gray-400">
                                    {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    )
})

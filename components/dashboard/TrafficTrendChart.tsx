'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataPoint {
    time: string
    download?: number
    upload?: number
    threats?: number
}

interface TrafficTrendChartProps {
    data?: DataPoint[]
    title?: string
}

export default function TrafficTrendChart({ data: propData, title = "Traffic Trend (24h)" }: TrafficTrendChartProps) {
    const [timeRange, setTimeRange] = useState<'24h' | '12h' | '6h'>('24h')
    const [chartData, setChartData] = useState<DataPoint[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch(`/api/traffic/trend?range=${timeRange}`)
            const result = await response.json()

            if (result.success && result.data) {
                setChartData(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch traffic trend:', error)
            setChartData([])
        } finally {
            setLoading(false)
        }
    }, [timeRange])

    useEffect(() => {
        if (propData && propData.length > 0) {
            setChartData(propData)
            setLoading(false)
        } else {
            fetchData()
        }
    }, [propData, fetchData])

    const ranges = [
        { key: '24h', label: '24h' },
        { key: '12h', label: '12h' },
        { key: '6h', label: '6h' },
    ] as const

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>

                {/* Time Range Toggle */}
                <div className="flex items-center rounded-lg bg-gray-800/50 p-1">
                    {ranges.map((range) => (
                        <button
                            key={range.key}
                            onClick={() => setTimeRange(range.key)}
                            className={cn(
                                'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                                timeRange === range.key
                                    ? 'bg-gray-700 text-white'
                                    : 'text-gray-400 hover:text-white'
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-6 mb-4">
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400" />
                    <span className="text-sm text-gray-400">Download</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-sm text-gray-400">Upload</span>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            }}
                            labelStyle={{ color: '#9ca3af' }}
                            itemStyle={{ color: '#f3f4f6' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="download"
                            stroke="#22d3ee"
                            strokeWidth={2}
                            fill="url(#downloadGradient)"
                        />
                        <Area
                            type="monotone"
                            dataKey="upload"
                            stroke="#34d399"
                            strokeWidth={2}
                            fill="url(#uploadGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}

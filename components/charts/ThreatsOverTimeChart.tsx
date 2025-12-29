'use client'

import { memo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar } from 'lucide-react'

interface Props {
    data: { date: string; count: number }[]
}

export default memo(function ThreatsOverTimeChart({ data }: Props) {
    const total = data.reduce((sum, item) => sum + item.count, 0)
    const avg = data.length > 0 ? Math.round(total / data.length) : 0
    const max = Math.max(...data.map(d => d.count), 0)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-[350px] w-full bg-gray-900/50 dark:bg-gray-900/50 light:bg-white backdrop-blur-sm rounded-2xl border border-gray-700/50 dark:border-gray-700/50 light:border-gray-200 p-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white dark:text-white light:text-gray-900">
                            Threats Over Time
                        </h3>
                        <p className="text-xs text-gray-400">Last 7 days activity</p>
                    </div>
                </div>

                {/* Stats badges */}
                <div className="flex items-center space-x-3">
                    <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <span className="text-xs text-gray-400">Avg: </span>
                        <span className="text-sm font-semibold text-cyan-400">{avg}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <span className="text-xs text-gray-400">Peak: </span>
                        <span className="text-sm font-semibold text-purple-400">{max}</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#6b7280"
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                border: '1px solid rgba(55, 65, 81, 0.5)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                padding: '12px 16px'
                            }}
                            labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                            itemStyle={{ color: '#06b6d4', fontWeight: 600 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            fill="url(#threatGradient)"
                            dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2, fill: '#0e1629' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
})

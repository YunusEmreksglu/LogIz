'use client'

import { memo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { motion } from 'framer-motion'
import { AlertTriangle, Shield } from 'lucide-react'

interface Props {
    data: { name: string; value: number }[]
}

const SEVERITY_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
    CRITICAL: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', label: 'Critical' },
    HIGH: { color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', label: 'High' },
    MEDIUM: { color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.15)', label: 'Medium' },
    LOW: { color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', label: 'Low' },
    INFO: { color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', label: 'Info' }
}

export default memo(function SeverityHeatmap({ data }: Props) {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const criticalCount = data.find(d => d.name === 'CRITICAL')?.value || 0
    const highCount = data.find(d => d.name === 'HIGH')?.value || 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="h-[350px] w-full bg-gray-900/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Severity Distribution</h3>
                        <p className="text-xs text-gray-400">Threat levels breakdown</p>
                    </div>
                </div>

                {/* Alert badge */}
                {(criticalCount > 0 || highCount > 0) && (
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                        <Shield className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-medium text-red-400">
                            {criticalCount + highCount} High Priority
                        </span>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mb-4">
                {data.map((item) => {
                    const config = SEVERITY_CONFIG[item.name] || SEVERITY_CONFIG.INFO
                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0
                    return (
                        <div
                            key={item.name}
                            className="flex items-center space-x-2 px-2 py-1 rounded-lg"
                            style={{ backgroundColor: config.bgColor }}
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: config.color }}
                            />
                            <span className="text-xs font-medium" style={{ color: config.color }}>
                                {config.label}: {item.value} ({percentage}%)
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Chart */}
            <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                        <XAxis
                            type="number"
                            stroke="#6b7280"
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            stroke="#6b7280"
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={70}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(55, 65, 81, 0.2)' }}
                            contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                border: '1px solid rgba(55, 65, 81, 0.5)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                padding: '12px 16px'
                            }}
                            labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={SEVERITY_CONFIG[entry.name]?.color || '#3b82f6'}
                                />
                            ))}
                            <LabelList
                                dataKey="value"
                                position="right"
                                fill="#9ca3af"
                                fontSize={12}
                                fontWeight={600}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
})

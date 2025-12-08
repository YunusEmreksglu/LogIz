'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
    data: { name: string; value: number }[]
}

const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: '#FF003C', // Cyber Red
    HIGH: '#FF5733',     // Orange
    MEDIUM: '#FCEE0A',   // Cyber Yellow
    LOW: '#00F0FF',      // Cyber Blue
    INFO: '#9CA3AF'      // Gray
}

export default function SeverityHeatmap({ data }: Props) {
    return (
        <div className="h-[300px] w-full bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Threat Severity</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip
                        cursor={{ fill: '#374151', opacity: 0.2 }}
                        contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '0.5rem',
                            color: '#F3F4F6'
                        }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#00F0FF'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

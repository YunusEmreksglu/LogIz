'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
    data: { date: string; count: number }[]
}

export default function ThreatsOverTimeChart({ data }: Props) {
    return (
        <div className="h-[300px] w-full bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Threats Over Time</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '0.5rem',
                            color: '#F3F4F6'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#00F0FF"
                        strokeWidth={2}
                        dot={{ fill: '#00F0FF', strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

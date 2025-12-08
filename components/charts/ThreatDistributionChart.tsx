'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface Props {
    data: { name: string; value: number }[]
}

const COLORS = ['#00F0FF', '#7000FF', '#FF003C', '#FCEE0A', '#00FF94']

export default function ThreatDistributionChart({ data }: Props) {
    return (
        <div className="h-[300px] w-full bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Threat Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '0.5rem',
                            color: '#F3F4F6'
                        }}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}

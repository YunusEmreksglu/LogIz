'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Grid3X3, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/dashboard'
import { cn } from '@/lib/utils'

// Attack categories based on UNSW-NB15 dataset
const categories = [
    { name: 'Normal', description: 'Meşru ağ trafiği', color: '#22c55e', risk: 'safe' },
    { name: 'Exploits', description: 'Sistem açıkları istismarı', color: '#ef4444', risk: 'critical' },
    { name: 'Reconnaissance', description: 'Ağ tarama ve keşif', color: '#f59e0b', risk: 'high' },
    { name: 'DoS', description: 'Hizmet engelleme saldırıları', color: '#dc2626', risk: 'critical' },
    { name: 'Generic', description: 'Genel saldırı kalıpları', color: '#8b5cf6', risk: 'medium' },
    { name: 'Shellcode', description: 'Zararlı shellcode çalıştırma', color: '#ec4899', risk: 'critical' },
    { name: 'Fuzzers', description: 'Fuzzing saldırı girişimleri', color: '#06b6d4', risk: 'medium' },
    { name: 'Worms', description: 'Kendi kendini çoğaltan zararlı', color: '#f43f5e', risk: 'critical' },
    { name: 'Backdoor', description: 'Arka kapı erişim girişimleri', color: '#7c3aed', risk: 'critical' },
    { name: 'Analysis', description: 'Trafik analiz saldırıları', color: '#0ea5e9', risk: 'low' },
]

interface CategoryData {
    name: string
    count: number
    percentage: number
    trend: number
    color: string
    description: string
    risk: string
    [key: string]: string | number
}



const riskColors = {
    safe: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function CategoriesPage() {
    const [data, setData] = useState<CategoryData[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch('/api/categories/stats')
            const result = await response.json()

            if (result.success && result.data) {
                setData(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error)
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

    const totalEvents = data.reduce((sum, cat) => sum + cat.count, 0)
    const threatEvents = data.filter(c => c.name !== 'Normal').reduce((sum, cat) => sum + cat.count, 0)
    const pieData = data.slice(0, 6) // Top 6 for pie chart

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Kategoriler"
                subtitle="Saldırı kategorisi dağılımı ve analizi"
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
                        <div className="p-2 rounded-lg bg-cyan-500/10">
                            <Grid3X3 className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-sm text-gray-400">Toplam Olay</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{totalEvents.toLocaleString()}</div>
                    {totalEvents === 0 && <p className="text-xs text-gray-500 mt-1">Henüz analiz yapılmadı</p>}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="p-5 rounded-2xl bg-gray-900/50 border border-gray-700/50"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <span className="text-sm text-gray-400">Tehdit Olayları</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{threatEvents.toLocaleString()}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 rounded-2xl bg-gray-900/50 border border-gray-700/50"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-sm text-gray-400">Normal Trafik</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {data.find(d => d.name === 'Normal')?.percentage || 0}%
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-5 rounded-2xl bg-gray-900/50 border border-gray-700/50"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-sm text-gray-400">Kategoriler</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{categories.length}</div>
                </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-900/50 rounded-2xl border border-gray-700/50 p-6"
                >
                    <h3 className="text-lg font-semibold text-white mb-6">Dağılım</h3>
                    <div className="flex items-center">
                        <div className="w-56 h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="count"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 ml-6 space-y-2">
                            {pieData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm text-gray-300">{item.name}</span>
                                    </div>
                                    <span className="text-sm text-gray-400">{item.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-gray-900/50 rounded-2xl border border-gray-700/50 p-6"
                >
                    <h3 className="text-lg font-semibold text-white mb-6">Kategoriye Göre Olay Sayısı</h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.filter(d => d.name !== 'Normal' && d.count > 0).slice(0, 6)}
                                layout="vertical"
                                margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="#6b7280"
                                    fontSize={11}
                                    width={120}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                    }}
                                    formatter={(value: number) => [`${value} olay`, 'Sayı']}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[0, 6, 6, 0]}
                                >
                                    {data.filter(d => d.name !== 'Normal' && d.count > 0).slice(0, 6).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {data.filter(d => d.name !== 'Normal' && d.count > 0).length === 0 && (
                        <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">
                            Henüz tehdit verisi bulunmuyor
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Categories Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900/50 rounded-2xl border border-gray-700/50 overflow-hidden"
            >
                <div className="p-5 border-b border-gray-700/50">
                    <h3 className="text-lg font-semibold text-white">Tüm Kategoriler</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700/50 bg-gray-800/30">
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Kategori</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Açıklama</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Sayı</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Yüzde</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Risk Seviyesi</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                            {data.map((category, index) => (
                                <motion.tr
                                    key={category.name}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                                    onClick={() => setSelectedCategory(category.name)}
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center space-x-3">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                                            <span className="text-sm font-medium text-white">{category.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-400">{category.description}</td>
                                    <td className="px-5 py-4 text-sm text-white font-mono">{category.count.toLocaleString()}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${category.percentage}%`, backgroundColor: category.color }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-400">{category.percentage}%</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cn(
                                            'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border capitalize',
                                            riskColors[category.risk as keyof typeof riskColors]
                                        )}>
                                            {category.risk}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cn(
                                            'text-sm font-medium',
                                            category.trend > 0 ? 'text-red-400' : category.trend < 0 ? 'text-emerald-400' : 'text-gray-400'
                                        )}>
                                            {category.trend > 0 ? '+' : ''}{category.trend}%
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}

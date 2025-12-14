import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// UNSW-NB15 based category definitions
const categoryConfig = [
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

export async function GET() {
    try {
        // Get threat type counts from database
        const threatCounts = await prisma.threat.groupBy({
            by: ['type'],
            _count: {
                type: true
            }
        })

        // Create a map for quick lookup
        const countMap = new Map(threatCounts.map(t => [t.type, t._count.type]))

        // Get total analysis count for "Normal" traffic simulation
        const totalAnalyses = await prisma.analysis.count()
        const totalThreats = threatCounts.reduce((sum, t) => sum + t._count.type, 0)

        // Calculate normal traffic (analyses that didn't detect threats)
        const normalCount = Math.max(0, totalAnalyses * 100 - totalThreats) // Assume ~100 logs per analysis average

        // Build category data with real counts
        const categories = categoryConfig.map(config => {
            let count = 0

            if (config.name === 'Normal') {
                count = normalCount
            } else {
                // Match category name to threat types
                count = countMap.get(config.name) || countMap.get(config.name.toUpperCase()) || 0
            }

            return {
                ...config,
                count,
                percentage: 0,
                trend: 0, // Trend calculation requires historical data, setting to 0 for accuracy
            }
        })

        // Calculate percentages
        const totalCount = categories.reduce((sum, c) => sum + c.count, 0)
        const withPercentages = categories.map(cat => ({
            ...cat,
            percentage: totalCount > 0 ? Math.round((cat.count / totalCount) * 100) : 0
        }))

        // Sort by count descending
        withPercentages.sort((a, b) => b.count - a.count)

        // Summary stats
        const threatEvents = withPercentages.filter(c => c.name !== 'Normal').reduce((sum, c) => sum + c.count, 0)

        return NextResponse.json({
            success: true,
            data: withPercentages,
            stats: {
                totalEvents: totalCount,
                threatEvents,
                normalPercentage: withPercentages.find(c => c.name === 'Normal')?.percentage || 0,
                categoryCount: categoryConfig.length
            }
        })
    } catch (error) {
        console.error('Error fetching category stats:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch category statistics' },
            { status: 500 }
        )
    }
}

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
        // Get analyses with their logFile - filter out orphans in processing
        const analyses = await prisma.analysis.findMany({
            select: {
                result: true,
                threatCount: true,
                logFileId: true
            }
        })

        // Filter to only include analyses with valid logFileId
        const validAnalyses = analyses.filter(a => a.logFileId != null)

        // Aggregate counts from all analyses
        const threatCounts: Record<string, number> = {}

        validAnalyses.forEach(analysis => {
            const result = analysis.result as any
            if (result && result.attack_type_distribution) {
                Object.entries(result.attack_type_distribution).forEach(([type, count]) => {
                    // Normalize key
                    const key = type.toString()
                    threatCounts[key] = (threatCounts[key] || 0) + (count as number)
                })
            }
        })

        // Also include live session threat types (with error handling for missing table)
        let liveSessions: any[] = []
        try {
            liveSessions = await prisma.liveSession.findMany({
                select: { threatTypes: true, totalLogs: true }
            })
        } catch (e) {
            // Table might not exist yet, continue without live session data
            console.log('LiveSession table not available, skipping...')
        }

        // Map SSH threat types to standard categories
        const sshToCategory: Record<string, string> = {
            'BRUTE_FORCE': 'Exploits',
            'INVALID_USER': 'Reconnaissance',
            'ROOT_LOGIN': 'Backdoor',
            'SUDO_USAGE': 'Generic',
            'LOGIN_SUCCESS': 'Normal',
            'SESSION_OPENED': 'Normal',
            'SESSION_CLOSED': 'Normal',
            'CONNECTION_CLOSED': 'Normal'
        }

        let liveSessionTotalLogs = 0
        liveSessions.forEach(session => {
            liveSessionTotalLogs += session.totalLogs || 0
            const types = session.threatTypes as Record<string, number> | null
            if (types) {
                Object.entries(types).forEach(([sshType, count]) => {
                    const category = sshToCategory[sshType] || 'Generic'
                    threatCounts[category] = (threatCounts[category] || 0) + count
                })
            }
        })

        // Create a map for quick lookup
        const countMap = new Map(Object.entries(threatCounts))

        // Get total events from analysis results (aggregated lines)
        let totalEvents = 0

        validAnalyses.forEach(analysis => {
            const result = analysis.result as any

            // Python API saves: totalLogLines (from result.results.total_records)
            // Also check threatCount for attacks
            const totalRecords = result?.totalLogLines || 0
            const attacksDetected = analysis.threatCount || 0

            if (totalRecords > 0) {
                totalEvents += totalRecords
            } else {
                // Fallback: if totalLogLines not available, use threatCount only
                // This means we can't calculate Normal traffic for old records
                totalEvents += attacksDetected
            }
        })

        // If we have 0 total events (new DB or no logs), avoid negative normal count
        const totalThreats = Array.from(countMap.values()).reduce((sum, val) => sum + val, 0)

        // Include live session logs in total events
        totalEvents += liveSessionTotalLogs

        // Ensure totalEvents is at least totalThreats
        totalEvents = Math.max(totalEvents, totalThreats)

        // Calculate normal traffic (Total Lines - Detected Threats)
        const normalCount = Math.max(0, totalEvents - totalThreats)

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
            percentage: totalCount > 0 ? parseFloat(((cat.count / totalCount) * 100).toFixed(1)) : 0
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

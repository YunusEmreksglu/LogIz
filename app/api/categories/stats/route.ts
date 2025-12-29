import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// UNSW-NB15 based category definitions
const categoryConfig = [
    { name: 'Normal', description: 'Meşru ağ trafiği', color: '#22c55e', risk: 'safe' },
    { name: 'Generic', description: 'Genel saldırı kalıpları', color: '#8b5cf6', risk: 'medium' },
    { name: 'Exploits', description: 'Sistem açıkları istismarı', color: '#ef4444', risk: 'critical' },
    { name: 'Fuzzers', description: 'Fuzzing saldırı girişimleri', color: '#06b6d4', risk: 'medium' },
    { name: 'DoS', description: 'Hizmet engelleme saldırıları', color: '#dc2626', risk: 'critical' },
    { name: 'Reconnaissance', description: 'Ağ tarama ve keşif', color: '#f59e0b', risk: 'high' },
    { name: 'Analysis', description: 'Trafik analiz saldırıları', color: '#0ea5e9', risk: 'low' },
    { name: 'Backdoor', description: 'Arka kapı erişim girişimleri', color: '#7c3aed', risk: 'critical' },
    { name: 'Shellcode', description: 'Zararlı shellcode çalıştırma', color: '#ec4899', risk: 'critical' },
    { name: 'Worms', description: 'Kendi kendini çoğaltan zararlı', color: '#f43f5e', risk: 'critical' },
]

export async function GET() {
    try {
        // Use Service Role client for public access
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Optional user filtering
        const session = await getServerSession(authOptions)
        const userId = session?.user?.id

        // Get analyses with their result JSON
        let query = supabaseAdmin
            .from('analyses')
            .select('result')
            .order('analyzed_at', { ascending: false })
            .limit(100)

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data: analyses, error } = await query

        if (error) throw error

        // Aggregate attack type distribution from all analyses
        const typeCounts = new Map<string, number>()
        let totalThreats = 0
        let totalLogLines = 0

        analyses?.forEach(analysis => {
            const result = analysis.result as any
            if (!result) return

            // Add total log lines from each analysis
            totalLogLines += result.totalLogLines || 0

            // Use attack_type_distribution if available (from Python backend)
            if (result.attack_type_distribution) {
                Object.entries(result.attack_type_distribution).forEach(([type, count]: [string, any]) => {
                    typeCounts.set(type, (typeCounts.get(type) || 0) + count)
                    totalThreats += count
                })
            } else if (result.threats) {
                // Fallback: count from threats array
                result.threats.forEach((t: any) => {
                    const type = t.type || 'Unknown'
                    typeCounts.set(type, (typeCounts.get(type) || 0) + 1)
                    totalThreats++
                })
            }
        })

        // Build category data with real counts
        const categories = categoryConfig.map(config => {
            const count = typeCounts.get(config.name) || 0
            return {
                ...config,
                count,
                percentage: 0,
                trend: 0,
            }
        })

        // Add any types not in config
        typeCounts.forEach((count, type) => {
            if (!categoryConfig.find(c => c.name === type)) {
                categories.push({
                    name: type,
                    description: `${type} attacks`,
                    color: '#6b7280',
                    risk: 'medium',
                    count,
                    percentage: 0,
                    trend: 0
                })
            }
        })

        // Calculate percentages
        const totalCount = categories.reduce((sum, c) => sum + c.count, 0)
        const withPercentages = categories.map(cat => ({
            ...cat,
            percentage: totalCount > 0 ? Math.round((cat.count / totalCount) * 1000) / 10 : 0
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
                totalLogLines,
                threatEvents,
                normalPercentage: withPercentages.find(c => c.name === 'Normal')?.percentage || 0,
                categoryCount: withPercentages.filter(c => c.count > 0).length,
                isMockData: false
            }
        })
    } catch (error) {
        console.error('Error fetching category stats:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch category statistics', details: String(error) },
            { status: 500 }
        )
    }
}

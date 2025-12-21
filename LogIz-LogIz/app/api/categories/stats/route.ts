import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Use Service Role client to bypass RLS since we validated session
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

        let threatCounts: any[] | null = null
        let totalAnalyses: number = 0
        let usingMockData = false

        try {
            // Try to get threat type counts from Supabase filtered by user
            const { data: tc, error: threatError } = await supabaseAdmin
                .from('threats')
                .select('type, analyses!inner(user_id)')
                .eq('analyses.user_id', userId)

            if (threatError) throw threatError
            threatCounts = tc

            // Get total analysis count filter by user
            const { count: ta, error: analysisError } = await supabaseAdmin
                .from('analyses')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)

            if (analysisError) throw analysisError
            totalAnalyses = ta || 0

        } catch (dbError) {
            console.warn('Database connection failed, using mock data:', dbError)
            usingMockData = true

            // Generate realistic mock data for demonstration
            threatCounts = [
                ...Array(15).fill({ type: 'Exploits' }),
                ...Array(10).fill({ type: 'DoS' }),
                ...Array(8).fill({ type: 'Reconnaissance' }),
                ...Array(5).fill({ type: 'Generic' }),
                ...Array(3).fill({ type: 'Shellcode' }),
                ...Array(2).fill({ type: 'Worms' }),
            ]
            totalAnalyses = 50 // Simulate 50 analysis runs
        }

        // Group and count threats by type
        const typeCounts = new Map<string, number>()
        threatCounts?.forEach((t: { type: string }) => {
            const currentCount = typeCounts.get(t.type) || 0
            typeCounts.set(t.type, currentCount + 1)
        })

        const totalThreats = threatCounts ? threatCounts.length : 0

        // Calculate normal traffic (analyses that didn't detect threats)
        // Assume ~100 logs per analysis average
        // If mock data, ensure we have a good amount of normal traffic
        const normalCount = usingMockData
            ? totalAnalyses * 50 // explicit mock calculation
            : Math.max(0, (totalAnalyses || 0) * 100 - totalThreats)

        // Build category data with real counts
        const categories = categoryConfig.map(config => {
            let count = 0

            if (config.name === 'Normal') {
                count = normalCount
            } else {
                // Match category name to threat types
                count = typeCounts.get(config.name) || typeCounts.get(config.name.toUpperCase()) || 0
            }

            return {
                ...config,
                count,
                percentage: 0,
                trend: usingMockData ? (Math.random() > 0.5 ? Math.floor(Math.random() * 10) : -Math.floor(Math.random() * 10)) : 0,
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
                categoryCount: categoryConfig.length,
                isMockData: usingMockData
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


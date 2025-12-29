import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Attack type metadata
const attackTypeInfo: Record<string, { category: string, severity: string }> = {
    'DoS': { category: 'Availability', severity: 'CRITICAL' },
    'Exploits': { category: 'Exploitation', severity: 'CRITICAL' },
    'Reconnaissance': { category: 'Discovery', severity: 'HIGH' },
    'Backdoor': { category: 'Persistence', severity: 'CRITICAL' },
    'Shellcode': { category: 'Execution', severity: 'CRITICAL' },
    'Worms': { category: 'Propagation', severity: 'CRITICAL' },
    'Fuzzers': { category: 'Testing', severity: 'MEDIUM' },
    'Generic': { category: 'General', severity: 'MEDIUM' },
    'Analysis': { category: 'Intelligence', severity: 'LOW' },
    'Normal': { category: 'Legitimate', severity: 'INFO' },
}

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
            .select('result, analyzed_at')
            .order('analyzed_at', { ascending: false })
            .limit(100)

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data: analyses, error } = await query

        if (error) throw error

        // Aggregate attack types from analyses
        const countMap = new Map<string, number>()
        const blockedMap = new Map<string, number>()
        const lastSeenMap = new Map<string, string>()

        analyses?.forEach(analysis => {
            const result = analysis.result as any
            if (!result) return

            // Use attack_type_distribution if available
            if (result.attack_type_distribution) {
                Object.entries(result.attack_type_distribution).forEach(([type, count]: [string, any]) => {
                    countMap.set(type, (countMap.get(type) || 0) + count)

                    // Update last seen
                    if (!lastSeenMap.has(type)) {
                        lastSeenMap.set(type, analysis.analyzed_at)
                    }

                    // Calculate blocked (assume 80% of CRITICAL types are blocked)
                    const info = attackTypeInfo[type]
                    if (info && info.severity === 'CRITICAL') {
                        blockedMap.set(type, (blockedMap.get(type) || 0) + Math.floor(count * 0.8))
                    }
                })
            }
        })

        // Build attack type stats
        const attackTypes = Object.entries(attackTypeInfo).map(([name, info]) => {
            const count = countMap.get(name) || 0
            const blocked = blockedMap.get(name) || 0
            const lastSeen = lastSeenMap.get(name)

            return {
                id: name.toLowerCase(),
                name,
                category: info.category,
                severity: info.severity,
                count,
                blocked,
                lastSeen: lastSeen || null,
                trend: 0,
            }
        })

        // Add types found but not in static list
        const knownTypes = new Set(Object.keys(attackTypeInfo))
        countMap.forEach((count, type) => {
            if (!knownTypes.has(type)) {
                attackTypes.push({
                    id: type.toLowerCase(),
                    name: type,
                    category: 'Unknown',
                    severity: 'UNKNOWN',
                    count,
                    blocked: blockedMap.get(type) || 0,
                    lastSeen: lastSeenMap.get(type) || null,
                    trend: 0
                })
            }
        })

        // Sort by count descending
        attackTypes.sort((a, b) => b.count - a.count)

        // Summary stats - exclude 'Normal' from attack counts
        const totalAttacks = attackTypes.filter(a => a.name !== 'Normal').reduce((sum, a) => sum + a.count, 0)
        const totalBlocked = attackTypes.filter(a => a.name !== 'Normal').reduce((sum, a) => sum + a.blocked, 0)
        const criticalTypes = attackTypes.filter(a => a.severity === 'CRITICAL').length

        return NextResponse.json({
            success: true,
            data: attackTypes,
            stats: {
                totalAttacks,
                totalBlocked,
                criticalTypes,
                attackTypeCount: attackTypes.filter(a => a.count > 0).length
            }
        })
    } catch (error) {
        console.error('Error fetching attack type stats:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch attack type statistics', details: String(error) },
            { status: 500 }
        )
    }
}

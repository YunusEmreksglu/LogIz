
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
}

export async function GET() {
    try {
        console.log('DEBUG: /api/attack-types/stats called')

        const { data: typeCounts, error: countError } = await supabase
            .rpc('get_threat_counts_by_type') // We might need an RPC for complex groupby, or do client side aggregation

        // Supabase basic grouping is hard without RPC. Let's fetch all (limit) or use a raw query if enabled.
        // For simplicity in this demo without RPC setup, we'll fetch recent threats and aggregate in JS.
        // In prod, use RPC: create function get_threat_counts...

        const { data: threats, error } = await supabase
            .from('threats')
            .select('type, severity, timestamp')
            .order('timestamp', { ascending: false })
            .limit(1000)

        if (error) throw error

        // Aggregate in memory
        const countMap = new Map<string, number>()
        const blockedMap = new Map<string, number>()
        const lastSeenMap = new Map<string, string>()

        threats?.forEach((t: any) => {
            // Count
            countMap.set(t.type, (countMap.get(t.type) || 0) + 1)

            // Blocked (Critical/High)
            if (['CRITICAL', 'HIGH'].includes(t.severity)) {
                blockedMap.set(t.type, (blockedMap.get(t.type) || 0) + 1)
            }

            // Last Seen
            if (!lastSeenMap.has(t.type)) {
                lastSeenMap.set(t.type, t.timestamp)
            }
        })

        // Build attack type stats
        const attackTypes = Object.entries(attackTypeInfo).map(([id, info]) => {
            const count = countMap.get(id) || 0
            const blocked = blockedMap.get(id) || 0
            const lastSeen = lastSeenMap.get(id)

            return {
                id: id.toLowerCase(),
                name: id,
                category: info.category,
                severity: info.severity,
                count,
                blocked,
                lastSeen: lastSeen || null,
                trend: 0,
            }
        })

        // Add types found in DB but not in static list
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

        // Summary stats
        const totalAttacks = attackTypes.reduce((sum, a) => sum + a.count, 0)
        const totalBlocked = attackTypes.reduce((sum, a) => sum + a.blocked, 0)
        const criticalTypes = attackTypes.filter(a => a.severity === 'CRITICAL').length

        return NextResponse.json({
            success: true,
            data: attackTypes,
            stats: {
                totalAttacks,
                totalBlocked,
                criticalTypes,
                attackTypeCount: attackTypes.length
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

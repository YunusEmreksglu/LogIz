import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ThreatLevel } from '@prisma/client'

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
        // Get attack type statistics from database
        const [typeCounts, recentThreats, blockedCounts] = await Promise.all([
            // Count by type
            prisma.threat.groupBy({
                by: ['type'],
                _count: { type: true }
            }),
            // Get last seen for each type
            prisma.threat.findMany({
                select: {
                    type: true,
                    timestamp: true
                },
                orderBy: { timestamp: 'desc' }
            }),
            // Count blocked (CRITICAL/HIGH) by type
            prisma.threat.groupBy({
                by: ['type'],
                where: {
                    severity: { in: [ThreatLevel.CRITICAL, ThreatLevel.HIGH] }
                },
                _count: { type: true }
            })
        ])

        // Create lookup maps
        const countMap = new Map(typeCounts.map(t => [t.type, t._count.type]))
        const blockedMap = new Map(blockedCounts.map(t => [t.type, t._count.type]))

        // Find last seen for each type
        const lastSeenMap = new Map<string, Date>()
        recentThreats.forEach(t => {
            if (t.timestamp && !lastSeenMap.has(t.type)) {
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
                lastSeen: lastSeen?.toISOString() || null,
                trend: 0, // Trend calculation requires historical data, setting to 0 for accuracy
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
            { success: false, error: 'Failed to fetch attack type statistics', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}

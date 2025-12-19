import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ThreatLevel } from '@prisma/client'

// Attack type metadata
const attackTypeInfo: Record<string, { category: string, severity: string }> = {
    'dos': { category: 'Availability', severity: 'CRITICAL' },
    'exploits': { category: 'Exploitation', severity: 'CRITICAL' },
    'reconnaissance': { category: 'Discovery', severity: 'HIGH' },
    'backdoor': { category: 'Persistence', severity: 'CRITICAL' },
    'shellcode': { category: 'Execution', severity: 'CRITICAL' },
    'worms': { category: 'Propagation', severity: 'CRITICAL' },
    'fuzzers': { category: 'Testing', severity: 'MEDIUM' },
    'generic': { category: 'General', severity: 'MEDIUM' },
    'analysis': { category: 'Intelligence', severity: 'LOW' },
}

export async function GET() {
    try {
        // Fetch all analyses to aggregate global stats
        const analyses = await prisma.analysis.findMany({
            select: {
                result: true,
                analyzedAt: true
            },
            orderBy: { analyzedAt: 'desc' }
        })

        // Aggregation structures
        const typeCounts: Record<string, number> = {}
        const lastSeenMap = new Map<string, Date>()

        // Process all analyses
        analyses.forEach(analysis => {
            const result = analysis.result as any
            const date = analysis.analyzedAt

            if (result && result.attack_type_distribution) {
                Object.entries(result.attack_type_distribution).forEach(([type, count]) => {
                    const normalizedType = type.toLowerCase()
                    const numCount = count as number

                    // Sum counts
                    typeCounts[normalizedType] = (typeCounts[normalizedType] || 0) + numCount

                    // Update last seen
                    if (date) {
                        const currentLast = lastSeenMap.get(normalizedType)
                        if (!currentLast || date > currentLast) {
                            lastSeenMap.set(normalizedType, date)
                        }
                    }
                })
            }
        })

        // Also include live session threat types (with error handling)
        let liveSessions: any[] = []
        try {
            liveSessions = await prisma.liveSession.findMany({
                select: { threatTypes: true, startedAt: true }
            })
        } catch (e) {
            // Table might not exist yet
            console.log('LiveSession table not available, skipping...')
        }

        // Map SSH threat types to attack types
        const sshToAttackType: Record<string, string> = {
            'BRUTE_FORCE': 'exploits',
            'INVALID_USER': 'reconnaissance',
            'ROOT_LOGIN': 'backdoor',
            'SUDO_USAGE': 'generic'
        }

        liveSessions.forEach(session => {
            const types = session.threatTypes as Record<string, number> | null
            const date = session.startedAt
            if (types) {
                Object.entries(types).forEach(([sshType, count]) => {
                    const attackType = sshToAttackType[sshType]
                    if (attackType) {
                        typeCounts[attackType] = (typeCounts[attackType] || 0) + count
                        if (date) {
                            const currentLast = lastSeenMap.get(attackType)
                            if (!currentLast || date > currentLast) {
                                lastSeenMap.set(attackType, date)
                            }
                        }
                    }
                })
            }
        })

        // Build response data
        const attackTypes = Object.entries(attackTypeInfo).map(([id, info]) => {
            const normalizedId = id.toLowerCase()
            const rawCount = typeCounts[normalizedId] || 0

            // Try to find if there are counts for mixed case or mapped keys if exact match failed
            // (Our backend usually saves keys as they are defined in Python, e.g. "DoS", "Exploits")
            // The python backend keys might match the Capitalized keys in `attackTypeInfo`.
            // Let's check keys in typeCounts.
            // Actually, let's look at how we filled typeCounts. We normalized to lower case.
            // So we should normalize the lookup key too.

            // Wait, if python sends "DoS", we stored it as "dos".
            // `attackTypeInfo` keys are "DoS", "Exploits" etc.
            // So `id` is "DoS". `normalizedId` is "dos".
            // So `typeCounts[normalizedId]` should find it if we normalized correctly.

            // However, we need to be careful about keys that might not match exactly.
            // Python keys: "DoS", "Exploits", "Reconnaissance".
            // Let's iterate `typeCounts` and see if we missed anything or if we should just loop `typeCounts`.
            // But we want to return the structured `attackTypeInfo` list even if count is 0.

            const count = typeCounts[normalizedId] || 0
            // Blocked logic: If severity is Critical or High, we assume all are blocked.
            const isBlocked = info.severity === 'CRITICAL' || info.severity === 'HIGH'
            const blocked = isBlocked ? count : 0

            return {
                id: normalizedId,
                name: id, // Keep original casing for display
                category: info.category,
                severity: info.severity,
                count,
                blocked,
                lastSeen: lastSeenMap.get(normalizedId)?.toISOString() || null,
                trend: 0 // Placeholder
            }
        })

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
            { success: false, error: 'Failed to fetch attack type statistics' },
            { status: 500 }
        )
    }
}

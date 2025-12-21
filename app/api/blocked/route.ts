import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ThreatLevel } from '@prisma/client'

// Map threat types to blocked reasons
const reasonMap: Record<string, string> = {
    'DoS': 'Rate Limit Exceeded',
    'Exploits': 'Signature Match',
    'Reconnaissance': 'Port Scan Detection',
    'Backdoor': 'Anomaly Detection',
    'Shellcode': 'Signature Match',
    'Worms': 'Malware Detection',
    'Fuzzers': 'Invalid Protocol',
    'Generic': 'Anomaly Detection',
    'Analysis': 'Traffic Analysis Block',
}

// Generate rule ID from threat type
const generateRuleId = (type: string, id: string): string => {
    const prefix = type.substring(0, 3).toUpperCase()
    const hash = id.substring(0, 4).toUpperCase()
    return `RULE-${prefix}-${hash}`
}

export async function GET(request: Request) {
    try {
        console.log('DEBUG: /api/blocked called')
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const search = searchParams.get('search') || ''

        const skip = (page - 1) * limit

        // Query threats with CRITICAL or HIGH severity (blocked traffic)
        const where: any = {
            severity: {
                in: [ThreatLevel.CRITICAL, ThreatLevel.HIGH]
            }
        }

        if (search) {
            where.OR = [
                { sourceIP: { contains: search } },
                { type: { contains: search } },
                { sourceCountry: { contains: search } }
            ]
        }

        const [threats, dbTotal] = await Promise.all([
            prisma.threat.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip,
                take: limit,
            }),
            prisma.threat.count({ where })
        ])

        // Calculate TRUE total for the stats card
        let trueTotalBlocked = dbTotal

        // If no search filter is active, get the true global total from Analysis summaries
        if (!search) {
            const aggregation = await prisma.analysis.aggregate({
                _sum: {
                    highSeverity: true // This column contains Critical + High sum
                }
            })
            trueTotalBlocked = aggregation._sum.highSeverity || 0
        }

        // Transform threats to blocked connection format
        const blockedConnections = threats.map((threat, index) => ({
            id: `block-${threat.id}`,
            timestamp: threat.timestamp?.toISOString() || new Date().toISOString(),
            sourceIP: threat.sourceIP || 'Unknown',
            sourceCountry: threat.sourceCountry || 'Unknown',
            destinationPort: threat.port || 0,
            protocol: 'TCP', // Default to TCP if unknown
            reason: reasonMap[threat.type] || 'Security Policy Violation',
            ruleId: generateRuleId(threat.type, threat.id),
            attempts: 1,
            lastAttempt: threat.timestamp ? new Date(threat.timestamp).toISOString() : new Date().toISOString(),
        }))

        // Calculate stats
        const uniqueIPs = new Set(threats.map(t => t.sourceIP)).size
        const countryStats = threats.reduce((acc, t) => {
            const country = t.sourceCountry || 'Unknown'
            acc[country] = (acc[country] || 0) + 1
            return acc
        }, {} as Record<string, number>)
        const topCountry = Object.entries(countryStats).sort((a, b) => b[1] - a[1])[0]

        return NextResponse.json({
            success: true,
            data: blockedConnections,
            stats: {
                totalBlocked: trueTotalBlocked,
                uniqueIPs,
                topCountry: topCountry ? topCountry[0] : '—',
                last24h: threats.filter(t =>
                    t.timestamp && Date.now() - new Date(t.timestamp).getTime() < 86400000
                ).length
            },
            pagination: {
                page,
                limit,
                total: dbTotal,
                totalPages: Math.ceil(dbTotal / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching blocked traffic:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch blocked traffic', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}

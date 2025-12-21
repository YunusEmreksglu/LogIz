import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const search = searchParams.get('search') || ''
        const severity = searchParams.get('severity') || ''

        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}

        if (search) {
            where.OR = [
                { sourceIP: { contains: search } },
                { type: { contains: search } },
                { description: { contains: search } },
            ]
        }

        if (severity && severity !== 'ALL') {
            where.severity = severity
        }

        // Get threats from Analysis results
        const threats = await prisma.threat.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip,
            take: limit,
            include: {
                analysis: {
                    select: {
                        id: true,
                        analyzedAt: true,
                    }
                }
            }
        })

        // Get exact counts from DB for pagination
        const dbTotal = await prisma.threat.count({ where })

        // Calculate global stats from Analysis summaries (for the cards)
        // We only do this if no specific filter is interfering, or we just want Global Stats regardless of filter?
        // Usually cards show Global Stats unless filtered.
        // Let's return Global Stats.

        const analyses = await prisma.analysis.findMany({ select: { result: true, threatCount: true } })
        let statsTotal = 0
        let statsCritical = 0
        let statsHigh = 0

        analyses.forEach(a => {
            statsTotal += a.threatCount
            const res = a.result as any
            if (res && res.severity_summary) {
                statsCritical += res.severity_summary.CRITICAL || 0
                statsHigh += res.severity_summary.HIGH || 0
            }
        })

        // If search/filter is active, pagination total is dbTotal
        // If NO filter is active, pagination total... should still be dbTotal because we only have 100 rows in DB?
        // Yes, to avoid empty pages.

        return NextResponse.json({
            success: true,
            data: threats.map(t => ({
                id: t.id,
                timestamp: t.timestamp?.toISOString() || new Date().toISOString(),
                sourceIP: t.sourceIP || 'Unknown',
                destinationIP: t.targetIP || 'Unknown',
                type: t.type,
                severity: t.severity,
                description: t.description,
                confidence: t.confidence,
                action: t.severity === 'CRITICAL' || t.severity === 'HIGH' ? 'Block' : 'Alert',
            })),
            stats: {
                total: statsTotal,
                critical: statsCritical,
                high: statsHigh,
                active: statsTotal, // Assuming all are active for now
                resolved: 0
            },
            pagination: {
                page,
                limit,
                total: dbTotal,
                totalPages: Math.ceil(dbTotal / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching threats:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch threats' },
            { status: 500 }
        )
    }
}

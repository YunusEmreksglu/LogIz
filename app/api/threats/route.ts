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

        // Get total count
        const total = await prisma.threat.count({ where })

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
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
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

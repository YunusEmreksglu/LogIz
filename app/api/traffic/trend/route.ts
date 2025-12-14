import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const range = searchParams.get('range') || '24h'

        // Calculate time range
        const now = new Date()
        let hoursBack = 24
        if (range === '12h') hoursBack = 12
        else if (range === '6h') hoursBack = 6

        const startTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000)

        // Get analyses within time range
        const analyses = await prisma.analysis.findMany({
            where: {
                analyzedAt: {
                    gte: startTime
                }
            },
            select: {
                analyzedAt: true,
                threatCount: true
            },
            orderBy: {
                analyzedAt: 'asc'
            }
        })

        // Create ordered array of hour slots (oldest to newest)
        const hourlySlots: { time: string; download: number; upload: number; threats: number; timestamp: number }[] = []

        // Generate hour slots from oldest to newest
        for (let i = hoursBack - 1; i >= 0; i--) {
            const slotTime = new Date(now.getTime() - i * 60 * 60 * 1000)
            // Round to hour start
            slotTime.setMinutes(0, 0, 0)

            const timeLabel = slotTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

            hourlySlots.push({
                time: timeLabel,
                download: 0,
                upload: 0,
                threats: 0,
                timestamp: slotTime.getTime()
            })
        }

        // Aggregate analyses into appropriate slots
        analyses.forEach(analysis => {
            const analysisTime = new Date(analysis.analyzedAt)
            // Round to hour start
            analysisTime.setMinutes(0, 0, 0)
            const analysisTimestamp = analysisTime.getTime()

            // Find the matching slot by timestamp
            const slot = hourlySlots.find(s => s.timestamp === analysisTimestamp)

            if (slot) {
                const threatCount = analysis.threatCount || 0
                slot.threats += threatCount
                // Bandwidth based on analysis activity
                slot.download += (threatCount * 50) + 100
                slot.upload += (threatCount * 10) + 20
            }
        })

        // Remove timestamp from output and ensure proper order (oldest first)
        const data = hourlySlots.map(({ time, download, upload, threats }) => ({
            time,
            download,
            upload,
            threats
        }))

        return NextResponse.json({
            success: true,
            range,
            data
        })
    } catch (error) {
        console.error('Error fetching traffic trend:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch traffic trend' },
            { status: 500 }
        )
    }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    // Stats API - Tüm verileri getir (auth gerektirmez)
    // Get statistics
    const [totalLogs, analyses, recentThreats] = await Promise.all([
      prisma.logFile.count(),
      prisma.analysis.findMany({
        include: {
          threats: true,
        },
        orderBy: { analyzedAt: 'desc' },
        take: 100 // Son 100 analiz
      }),
      prisma.threat.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10, // Son 10 tehdit
        include: {
          analysis: true
        }
      })
    ])

    const totalThreats = analyses.reduce((sum, a) => sum + a.threatCount, 0)
    const criticalThreats = analyses.reduce(
      (sum, a) => sum + a.threats.filter(t => t.severity === 'CRITICAL').length,
      0
    )

    // Last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentAnalyses = await prisma.analysis.count({
      where: {
        analyzedAt: {
          gte: sevenDaysAgo,
        },
      },
    })

    // Aggregate data for charts
    const threatsOverTimeMap = new Map<string, number>()
    const threatTypeMap = new Map<string, number>()
    const severityMap = new Map<string, number>()

    // Initialize last 7 days for time chart
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      threatsOverTimeMap.set(dateStr, 0)
    }

    analyses.forEach(analysis => {
      analysis.threats.forEach(threat => {
        // Time aggregation - use threat timestamp or analysis date as fallback
        const threatDate = threat.timestamp || analysis.analyzedAt
        if (threatDate) {
          const dateStr = new Date(threatDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          // Always add to count, even if not in last 7 days map (for current day)
          threatsOverTimeMap.set(dateStr, (threatsOverTimeMap.get(dateStr) || 0) + 1)
        }

        // Type aggregation
        const type = threat.type.replace('_', ' ')
        threatTypeMap.set(type, (threatTypeMap.get(type) || 0) + 1)

        // Severity aggregation
        severityMap.set(threat.severity, (severityMap.get(threat.severity) || 0) + 1)
      })
    })

    const threatsOverTime = Array.from(threatsOverTimeMap.entries()).map(([date, count]) => ({ date, count }))
    const threatDistribution = Array.from(threatTypeMap.entries()).map(([name, value]) => ({ name, value }))
    const severityDistribution = Array.from(severityMap.entries()).map(([name, value]) => ({ name, value }))

    return NextResponse.json({
      totalLogs,
      totalThreats,
      criticalThreats,
      recentAnalyses,
      threatsOverTime,
      threatDistribution,
      severityDistribution,
      recentThreats: recentThreats.map(t => ({
        id: t.id,
        type: t.type,
        severity: t.severity,
        description: t.description,
        sourceIP: t.sourceIP,
        sourceLat: t.sourceLat,
        sourceLon: t.sourceLon,
        sourceCountry: t.sourceCountry,
        detectedAt: t.timestamp?.toISOString() || new Date().toISOString()
      }))
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

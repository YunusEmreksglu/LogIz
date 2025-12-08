import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get statistics
    const [totalLogs, analyses] = await Promise.all([
      prisma.logFile.count({ where: { userId } }),
      prisma.analysis.findMany({
        where: {
          logFile: { userId },
        },
        include: {
          threats: true,
        },
      }),
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
        logFile: { userId },
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
        // Time aggregation
        if (threat.timestamp) {
          const dateStr = new Date(threat.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (threatsOverTimeMap.has(dateStr)) {
            threatsOverTimeMap.set(dateStr, (threatsOverTimeMap.get(dateStr) || 0) + 1)
          }
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
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

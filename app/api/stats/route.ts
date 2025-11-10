import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // TODO: Get userId from session
    const userId = 'temp-user-id'

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

    return NextResponse.json({
      totalLogs,
      totalThreats,
      criticalThreats,
      recentAnalyses,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

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
        select: {
          threatCount: true,
          analyzedAt: true,
          result: true
        },
        orderBy: { analyzedAt: 'desc' },
        // Removed take: 100 to get global stats
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
    const criticalThreats = analyses.reduce((sum, a) => {
      const result = a.result as any
      return sum + (result?.severity_summary?.CRITICAL || 0)
    }, 0)

    // Total log lines across all analyses (for consistent "Total Events" display)
    const totalLogLines = analyses.reduce((sum, a) => {
      const result = a.result as any
      return sum + (result?.totalLogLines || a.threatCount || 0)
    }, 0)

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
      const result = analysis.result as any

      // Time aggregation - use analysis date directly with full count
      if (analysis.analyzedAt) {
        const dateStr = new Date(analysis.analyzedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        threatsOverTimeMap.set(dateStr, (threatsOverTimeMap.get(dateStr) || 0) + analysis.threatCount)
      }

      // Type aggregation from JSON result
      if (result && result.attack_type_distribution) {
        Object.entries(result.attack_type_distribution).forEach(([type, count]) => {
          const key = type.toString().replace('_', ' ')
          threatTypeMap.set(key, (threatTypeMap.get(key) || 0) + (count as number))
        })
      }

      // Severity aggregation from JSON result
      if (result && result.severity_summary) {
        Object.entries(result.severity_summary).forEach(([severity, count]) => {
          severityMap.set(severity, (severityMap.get(severity) || 0) + (count as number))
        })
      }
    })



    // Live sessions integration (with error handling)
    let liveSessions: any[] = []
    try {
      liveSessions = await prisma.liveSession.findMany({
        select: { threatTypes: true, totalLogs: true, startedAt: true }
      })
    } catch (e) {
      console.log('LiveSession query failed in stats:', e)
    }

    // Include live session logs in totalLogs
    const liveSessionTotalLogs = liveSessions.reduce((sum, s) => sum + (s.totalLogs || 0), 0)

    // Include live session threats in counts
    let liveSessionThreats = 0

    // Map SSH threat types to display categories for Top Applications
    const sshToAttackType: Record<string, string> = {
      'BRUTE_FORCE': 'Exploits',
      'INVALID_USER': 'Reconnaissance',
      'ROOT_LOGIN': 'Backdoor',
      'SUDO_USAGE': 'Generic',
      'LOGIN_SUCCESS': 'Normal',
      'SESSION_OPENED': 'Normal',
      'SESSION_CLOSED': 'Normal',
      'CONNECTION_CLOSED': 'Normal'
    }

    liveSessions.forEach(session => {
      const types = session.threatTypes as Record<string, number> | null
      const date = session.startedAt

      if (types) {
        Object.entries(types).forEach(([sshType, count]) => {
          // Add to threat counts if not normal
          if (sshToAttackType[sshType] !== 'Normal') {
            liveSessionThreats += count

            // Add to distribution
            const category = sshToAttackType[sshType] || 'Generic'
            threatTypeMap.set(category, (threatTypeMap.get(category) || 0) + count)

            // Add to severity: BRUTE_FORCE -> High/Critical mapping?
            // For simplicity, let's map common SSH threats to severity
            let severity = 'MEDIUM'
            if (sshType === 'ROOT_LOGIN') severity = 'CRITICAL'
            if (sshType === 'BRUTE_FORCE') severity = 'HIGH'

            severityMap.set(severity, (severityMap.get(severity) || 0) + count)
          }

          // Add to timeline
          if (date) {
            const dateStr = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (threatsOverTimeMap.has(dateStr)) {
              threatsOverTimeMap.set(dateStr, (threatsOverTimeMap.get(dateStr) || 0) + count)
            }
          }
        })
      }
    })

    const finalTotalLogs = totalLogs + liveSessions.length // Total Files + Total Sessions

    const finalTotalThreats = totalThreats + liveSessionThreats

    const threatsOverTime = Array.from(threatsOverTimeMap.entries()).map(([date, count]) => ({ date, count }))
    const threatDistribution = Array.from(threatTypeMap.entries()).map(([name, value]) => ({ name, value }))
    const severityDistribution = Array.from(severityMap.entries()).map(([name, value]) => ({ name, value }))

    return NextResponse.json({
      totalLogs: finalTotalLogs,
      totalThreats: finalTotalThreats,
      totalLogLines: totalLogLines + liveSessionTotalLogs, // Total analyzed log lines
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

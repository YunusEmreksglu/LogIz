import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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
    // 1. Total Logs Count
    const { count: totalLogs, error: logsError } = await supabase
      .from('log_files')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (logsError) throw logsError

    // 2. Analyses with Threats (for calculations)
    // We use !inner on log_files to filter analyses by the user who owns the log file
    const { data: analysesData, error: analysesError } = await supabase
      .from('analyses')
      .select(`
        *,
        threats (*),
        log_files!inner (user_id)
      `)
      .eq('log_files.user_id', userId)

    if (analysesError) throw analysesError

    const analyses = analysesData || []

    const totalThreats = analyses.reduce((sum, a) => sum + (a.threat_count || 0), 0)

    // Explicitly type 't' as any or interact carefully since Supabase types might not be inferred here without generics
    const criticalThreats = analyses.reduce(
      (sum, a) => sum + (a.threats || []).filter((t: any) => t.severity === 'CRITICAL').length,
      0
    )

    // Last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: recentAnalyses, error: recentError } = await supabase
      .from('analyses')
      .select('*, log_files!inner(user_id)', { count: 'exact', head: true })
      .eq('log_files.user_id', userId)
      .gte('analyzed_at', sevenDaysAgo.toISOString())

    if (recentError) throw recentError

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
      // analysis.threats is an array of objects
      const threats = analysis.threats || []
      // Use 'any' or specific type for threat to avoid TS errors during quick refactor if types aren't fully generated
      threats.forEach((threat: any) => {
        // Time aggregation
        if (threat.timestamp) {
          const dateStr = new Date(threat.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (threatsOverTimeMap.has(dateStr)) {
            threatsOverTimeMap.set(dateStr, (threatsOverTimeMap.get(dateStr) || 0) + 1)
          }
        }

        // Type aggregation
        // Database has snake_case types likely? Or maybe they are stored raw. 
        // Existing code did replace('_', ' '), let's keep it safe.
        const type = (threat.type || 'Unknown').replace('_', ' ')
        threatTypeMap.set(type, (threatTypeMap.get(type) || 0) + 1)

        // Severity aggregation
        const severity = threat.severity || 'UNKNOWN'
        severityMap.set(severity, (severityMap.get(severity) || 0) + 1)
      })
    })

    const threatsOverTime = Array.from(threatsOverTimeMap.entries()).map(([date, count]) => ({ date, count }))
    const threatDistribution = Array.from(threatTypeMap.entries()).map(([name, value]) => ({ name, value }))
    const severityDistribution = Array.from(severityMap.entries()).map(([name, value]) => ({ name, value }))

    return NextResponse.json({
      totalLogs: totalLogs || 0,
      totalThreats,
      criticalThreats,
      recentAnalyses: recentAnalyses || 0,
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

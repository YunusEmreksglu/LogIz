import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    // Use Service Role client to get all data (public dashboard)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Optional: Check session for user-specific filtering
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // Get all analyses with their results (contains attack data)
    let query = supabaseAdmin
      .from('analyses')
      .select('id, result, threat_count, high_severity, medium_severity, low_severity, analyzed_at, user_id')
      .order('analyzed_at', { ascending: false })
      .limit(100)

    // If user is logged in, filter by user
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: analyses, error: analysesError } = await query

    if (analysesError) throw analysesError

    // Get log files count
    let logsQuery = supabaseAdmin
      .from('log_files')
      .select('*', { count: 'exact', head: true })

    if (userId) {
      logsQuery = logsQuery.eq('user_id', userId)
    }

    const { count: totalLogs } = await logsQuery

    // Aggregate stats from analyses
    let totalThreats = 0
    let criticalThreats = 0
    let highThreats = 0
    let mediumThreats = 0
    const threatTypeMap = new Map<string, number>()
    const severityMap = new Map<string, number>()
    const recentThreats: any[] = []
    const threatLocations: any[] = []
    const threatsOverTimeMap = new Map<string, number>()

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      threatsOverTimeMap.set(dateStr, 0)
    }

    analyses?.forEach(analysis => {
      const result = analysis.result as any
      if (!result) return

      totalThreats += analysis.threat_count || 0

      // Severity from result.summary or calculate from threats
      if (result.summary) {
        criticalThreats += result.summary.critical || 0
        highThreats += result.summary.high || 0
        mediumThreats += result.summary.medium || 0
      }

      // Attack Type Distribution from result
      if (result.attack_type_distribution) {
        Object.entries(result.attack_type_distribution).forEach(([type, count]: [string, any]) => {
          threatTypeMap.set(type, (threatTypeMap.get(type) || 0) + count)
        })
      }

      // Process threats if available
      const threats = result.threats || []
      threats.slice(0, 10).forEach((threat: any) => {
        // Severity aggregation
        const severity = threat.severity || 'UNKNOWN'
        severityMap.set(severity, (severityMap.get(severity) || 0) + 1)

        // Time aggregation
        const dateStr = new Date(analysis.analyzed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (threatsOverTimeMap.has(dateStr)) {
          threatsOverTimeMap.set(dateStr, (threatsOverTimeMap.get(dateStr) || 0) + 1)
        }

        // Recent threats
        if (recentThreats.length < 5) {
          recentThreats.push({
            id: threat.id || `threat-${recentThreats.length}`,
            timestamp: threat.timestamp || analysis.analyzed_at,
            detectedAt: threat.timestamp || analysis.analyzed_at,
            sourceIP: threat.sourceIP || threat.source_ip || '—',
            destinationIP: threat.targetIP || threat.target_ip || '—',
            targetIP: threat.targetIP || threat.target_ip || '—',
            type: threat.type || 'Unknown',
            severity: threat.severity,
            description: threat.description
          })
        }

        // Locations
        if (threat.sourceLat || threat.source_lat) {
          threatLocations.push({
            id: threat.id,
            sourceLat: threat.sourceLat || threat.source_lat,
            sourceLon: threat.sourceLon || threat.source_lon,
            sourceCountry: threat.sourceCountry || threat.source_country,
            sourceIP: threat.sourceIP || threat.source_ip,
            type: threat.type
          })
        }
      })
    })

    const recentAnalyses = analyses?.length || 0
    const threatsOverTime = Array.from(threatsOverTimeMap.entries()).map(([date, count]) => ({ date, count }))
    const threatDistribution = Array.from(threatTypeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
    const severityDistribution = Array.from(severityMap.entries()).map(([name, value]) => ({ name, value }))

    return NextResponse.json({
      totalLogs: totalLogs || 0,
      totalThreats,
      criticalThreats,
      highThreats,
      mediumThreats,
      recentAnalyses,
      threatsOverTime,
      threatDistribution,
      severityDistribution,
      recentThreats,
      threatLocations: threatLocations.slice(0, 100)
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: String(error) },
      { status: 500 }
    )
  }
}

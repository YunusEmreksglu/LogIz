import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Use Service Role client to bypass RLS since we validated session
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

    // Get statistics
    // 1. Total Logs Count
    const { count: totalLogs, error: logsError } = await supabaseAdmin
      .from('log_files')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (logsError) throw logsError

    // 2. Analyses with Threats (for calculations)
    // Now we can filter analyses directly by user_id
    const { data: analysesData, error: analysesError } = await supabaseAdmin
      .from('analyses')
      .select(`
        *,
        threats (*)
      `)
      .eq('user_id', userId)

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

    const { count: recentAnalyses, error: recentError } = await supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
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

    // Flatten threats from all analyses
    let allThreats: any[] = []
    analyses.forEach(a => {
      if (a.threats && Array.isArray(a.threats)) {
        allThreats.push(...a.threats)
      }
    })

    // Sort by timestamp desc for Recent Threats
    allThreats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const recentThreatsRaw = allThreats.slice(0, 5)

    const recentThreats = recentThreatsRaw.map(t => ({
      id: t.id,
      timestamp: t.timestamp,
      detectedAt: t.timestamp,
      sourceIP: t.source_ip,
      destinationIP: t.target_ip,
      targetIP: t.target_ip,
      type: t.type,
      severity: t.severity,
      description: t.description
    }))

    // Threat Locations for Map
    const threatLocations = allThreats
      .filter(t => t.source_lat && t.source_lon)
      .map(t => ({
        id: t.id,
        sourceLat: t.source_lat,
        sourceLon: t.source_lon,
        sourceCountry: t.source_country,
        sourceIP: t.source_ip,
        type: t.type
      }))

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
      recentThreats,
      threatLocations
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

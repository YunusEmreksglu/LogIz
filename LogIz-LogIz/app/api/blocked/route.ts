
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Map threat types to blocked reasons
const reasonMap: Record<string, string> = {
    'DoS': 'Rate Limit Exceeded',
    'Exploits': 'Signature Match',
    'Reconnaissance': 'Port Scan Detection',
    'Backdoor': 'Anomaly Detection',
    'Shellcode': 'Signature Match',
    'Worms': 'Malware Detection',
    'Fuzzers': 'Invalid Protocol',
    'Generic': 'Anomaly Detection',
    'Analysis': 'Traffic Analysis Block',
}

// Generate rule ID from threat type
const generateRuleId = (type: string, id: string): string => {
    const prefix = (type || 'UNK').substring(0, 3).toUpperCase()
    const hash = (id || '0000').substring(0, 4).toUpperCase()
    return `RULE-${prefix}-${hash}`
}

export async function GET(request: Request) {
    try {
        console.log('DEBUG: /api/blocked called')
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const search = searchParams.get('search') || ''

        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('threats')
            .select('*, analyses!inner(log_files!inner(user_id))', { count: 'exact' })
            .eq('analyses.log_files.user_id', userId)
            .in('severity', ['CRITICAL', 'HIGH'])
            .order('timestamp', { ascending: false })
            .range(from, to)

        if (search) {
            query = query.or(`source_ip.ilike.%${search}%,type.ilike.%${search}%,source_country.ilike.%${search}%`)
        }

        const { data: threats, error, count } = await query

        if (error) throw error

        const total = count || 0

        // Transform threats to blocked connection format
        const blockedConnections = threats.map((threat: any) => ({
            id: `block-${threat.id}`,
            timestamp: threat.timestamp || new Date().toISOString(),
            sourceIP: threat.source_ip || 'Unknown',
            sourceCountry: threat.source_country || 'Unknown',
            destinationPort: threat.port || 0,
            protocol: 'TCP', // Default to TCP if unknown
            reason: reasonMap[threat.type] || 'Security Policy Violation',
            ruleId: generateRuleId(threat.type, threat.id),
            attempts: 1,
            lastAttempt: threat.timestamp ? new Date(threat.timestamp).toISOString() : new Date().toISOString(),
        }))

        // Stats calculation (simplified without complex aggregations)
        const uniqueIPs = new Set(threats.map((t: any) => t.source_ip)).size

        // Find top country from current batch (approximate)
        const countryStats: Record<string, number> = {}
        threats.forEach((t: any) => {
            const c = t.source_country || 'Unknown'
            countryStats[c] = (countryStats[c] || 0) + 1
        })
        const topCountryEntry = Object.entries(countryStats).sort((a, b) => b[1] - a[1])[0]
        const topCountry = topCountryEntry ? topCountryEntry[0] : '—'

        return NextResponse.json({
            success: true,
            data: blockedConnections,
            stats: {
                totalBlocked: total,
                uniqueIPs,
                topCountry,
                last24h: 0 // Placeholder, requires separate query
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching blocked traffic:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch blocked traffic', details: String(error) },
            { status: 500 }
        )
    }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
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

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const search = searchParams.get('search') || ''
        const severity = searchParams.get('severity') || ''

        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabaseAdmin
            .from('threats')
            .select('*, analyses!inner(id, analyzed_at)', { count: 'exact' })
            .eq('analyses.user_id', userId)
            .order('timestamp', { ascending: false })
            .range(from, to)

        if (search) {
            query = query.or(`source_ip.ilike.%${search}%,type.ilike.%${search}%,description.ilike.%${search}%`)
        }

        if (severity && severity !== 'ALL') {
            query = query.eq('severity', severity)
        }

        const { data: threats, error, count } = await query

        if (error) throw error

        const total = count || 0

        return NextResponse.json({
            success: true,
            data: threats.map((t: any) => ({
                id: t.id,
                timestamp: t.timestamp || new Date().toISOString(),
                sourceIP: t.source_ip || 'Unknown',
                destinationIP: t.target_ip || 'Unknown',
                type: t.type,
                severity: t.severity,
                description: t.description,
                confidence: t.confidence,
                action: (t.severity === 'CRITICAL' || t.severity === 'HIGH') ? 'Block' : 'Alert',
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

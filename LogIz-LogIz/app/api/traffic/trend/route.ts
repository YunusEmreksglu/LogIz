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

        // Default range 24h
        const { searchParams } = new URL(request.url)
        const range = searchParams.get('range') || '24h'

        let hours = 24
        if (range === '12h') hours = 12
        if (range === '6h') hours = 6

        // Calculate start date
        const startDate = new Date()
        hours = Math.max(hours, 0)
        startDate.setHours(startDate.getHours() - hours)

        // Fetch log files uploaded by user in this range
        const { data: logFiles, error } = await supabaseAdmin
            .from('log_files')
            .select('file_size, uploaded_at')
            .eq('user_id', userId)
            .gte('uploaded_at', startDate.toISOString())
            .order('uploaded_at', { ascending: true })

        if (error) throw error

        // Fetch threats as "download/blocked" traffic for correlation (optional, interpreting threat count as 'download' activity impact)
        // For now we will just use log size for upload and 0 or simulated data for download if needed.
        // Let's return just upload data for now.

        const trendData: { time: string; upload: number; download: number }[] = []

        // bucket into hours
        const bucketMap = new Map<number, { upload: number; download: number }>()

        // Initialize buckets
        const now = new Date()
        for (let i = 0; i <= hours; i++) {
            const d = new Date(startDate)
            d.setHours(d.getHours() + i)
            bucketMap.set(d.getHours(), { upload: 0, download: 0 })
        }

        logFiles?.forEach(file => {
            const d = new Date(file.uploaded_at)
            const hour = d.getHours()
            const current = bucketMap.get(hour) || { upload: 0, download: 0 }

            // Convert bytes to MB
            const sizeMB = file.file_size ? file.file_size / (1024 * 1024) : 0
            current.upload += sizeMB
            bucketMap.set(hour, current)
        })

        // Create sorted array
        // We want the array to start from startDate up to now
        // Create sorted array
        // We want the array to start from startDate up to now
        for (let i = 0; i <= hours; i++) {
            const d = new Date(startDate)
            d.setHours(d.getHours() + i)
            const hour = d.getHours()
            const vals = bucketMap.get(hour) || { upload: 0, download: 0 }

            trendData.push({
                time: `${hour}:00`,
                upload: Number((vals.upload * 1024).toFixed(2)),
                download: Number((vals.download * 1024).toFixed(2))
            })
        }

        return NextResponse.json({ success: true, data: trendData })

    } catch (error) {
        console.error('Traffic trend error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch traffic trend' },
            { status: 500 }
        )
    }
}

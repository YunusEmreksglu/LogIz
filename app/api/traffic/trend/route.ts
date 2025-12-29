import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        // Use Service Role client for public access
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

        const session = await getServerSession(authOptions)
        const userId = session?.user?.id

        // Default range 24h
        const { searchParams } = new URL(request.url)
        const range = searchParams.get('range') || '24h'

        let hours = 24
        if (range === '12h') hours = 12
        if (range === '6h') hours = 6

        // Calculate start date
        const startDate = new Date()
        const now = new Date()
        startDate.setHours(startDate.getHours() - hours)

        // Fetch log files uploaded in this range
        let query = supabaseAdmin
            .from('log_files')
            .select('file_size, uploaded_at')
            .gte('uploaded_at', startDate.toISOString())
            .order('uploaded_at', { ascending: true })

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data: logFiles, error } = await query

        if (error) throw error

        // Initialize buckets for each hour in the range
        // We want data points for every hour from start to now
        const trendData: { time: string; upload: number; download: number }[] = []
        const bucketMap = new Map<number, { upload: number; download: number }>()

        // Fill buckets with 0
        for (let i = 0; i <= hours; i++) {
            const d = new Date(now)
            d.setHours(d.getHours() - i)
            // We use hour as key. Beware of day wrapping. 
            // Better to use full timestamp or just simplistic hour for 24h view.
            // For correct sorting, let's just push to array at the end.
            // Actually, let's map by "Day-Hour" string to be safe or just epoch hour.
            // Simpler: Just create the structure first.
        }

        // Correct approach: generate labels and init map
        const labels: string[] = []
        // We want to return exactly 'hours' + 1 points roughly, or just covering the range.
        // Let's iterate from startDate to now by hour.

        const current = new Date(startDate)
        // reset minutes to 0 for cleaner buckets
        current.setMinutes(0, 0, 0)

        while (current <= now) {
            const hour = current.getHours()
            const timeLabel = `${hour}:00`
            // Use timeLabel as key for simplicity in this view, assuming < 24h range handles wrapping? 
            // If range is 24h, we might have two "12:00" (yesterday and today). 
            // So we need unique keys.
            const key = current.getTime()

            bucketMap.set(key, { upload: 0, download: 0 })
            current.setHours(current.getHours() + 1)
        }

        logFiles?.forEach(file => {
            const d = new Date(file.uploaded_at)
            d.setMinutes(0, 0, 0)
            const key = d.getTime()

            // Find closest bucket? Or exact match. 
            // Log timestamp might not be exact hour zero.
            // Let's round to nearest hour or floor.

            // Re-calculate simplistic buckets:
            // Find the bucket in bucketMap that is closest or equal (floored hour)

            // Optimization: Just floor the log time to hour
            const logTime = new Date(file.uploaded_at)
            logTime.setMinutes(0, 0, 0)
            const logKey = logTime.getTime()

            if (bucketMap.has(logKey)) {
                const currentVal = bucketMap.get(logKey)!
                // Convert bytes to KB for chart (visuals look better) or MB?
                // Chart component divided by 1000 in tickFormatter, implying it expects values compatible with that.
                // Let's return Bytes and let chart handle, OR return KB.
                // Component: tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
                // If we send Bytes: 1000000 bytes = 1000K = 1M. 
                // Let's send KB directly? 
                // Previous code: vals.upload * 1024 (MB * 1024 = KB).

                const sizeKB = file.file_size ? file.file_size / 1024 : 0
                currentVal.upload += sizeKB

                // Simulate download/processing traffic as a factor of upload
                currentVal.download += sizeKB * 1.2

                bucketMap.set(logKey, currentVal)
            }
        })

        // Convert map to array sorted by time
        const sortedKeys = Array.from(bucketMap.keys()).sort((a, b) => a - b)

        sortedKeys.forEach(key => {
            const d = new Date(key)
            const hour = d.getHours()
            const val = bucketMap.get(key)!

            trendData.push({
                time: `${hour}:00`,
                upload: Math.round(val.upload),
                download: Math.round(val.download)
            })
        })

        return NextResponse.json({ success: true, data: trendData })

    } catch (error) {
        console.error('Traffic trend error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch traffic trend' },
            { status: 500 }
        )
    }
}

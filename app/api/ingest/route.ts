import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Threat detection based on log content
function analyzeLog(raw: string): { severity: string; threatType: string | null } {
    const lower = raw.toLowerCase()

    if (lower.includes('failed password')) {
        return { severity: 'HIGH', threatType: 'BRUTE_FORCE' }
    }
    if (lower.includes('root') || lower.includes('uid=0')) {
        return { severity: 'CRITICAL', threatType: 'ROOT_ACCESS' }
    }
    if (lower.includes('accepted password')) {
        return { severity: 'LOW', threatType: 'LOGIN_SUCCESS' }
    }
    if (lower.includes('invalid user')) {
        return { severity: 'MEDIUM', threatType: 'INVALID_USER' }
    }
    if (lower.includes('connection closed')) {
        return { severity: 'INFO', threatType: 'CONNECTION_CLOSED' }
    }

    return { severity: 'INFO', threatType: null }
}

// SSE clients list (shared with live-stream)
let sseClients: WritableStreamDefaultWriter<any>[] = []

// Export for live-stream to use
export function addSSEClient(client: WritableStreamDefaultWriter<any>) {
    sseClients.push(client)
}

export function removeSSEClient(client: WritableStreamDefaultWriter<any>) {
    sseClients = sseClients.filter(c => c !== client)
}

export async function POST(request: NextRequest) {
    try {
        // Validate API Key
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
        }

        const apiKey = authHeader.substring(7) // Remove 'Bearer '

        // Verify API key exists and is active
        const { data: keyData, error: keyError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('key', apiKey)
            .eq('is_active', true)
            .single()

        if (keyError || !keyData) {
            return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 401 })
        }

        // Parse request body
        const body = await request.json()
        const { log, source, timestamp } = body

        if (!log) {
            return NextResponse.json({ error: 'Log content required' }, { status: 400 })
        }

        // Analyze log for threats
        const { severity, threatType } = analyzeLog(log)

        // Create log entry
        const logEntry = {
            id: randomUUID(),
            raw: log,
            source: source || 'Unknown Agent',
            source_ip: source,
            severity,
            threat_type: threatType,
            description: `Log from ${source || 'agent'}`,
            timestamp: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
            user_id: keyData.user_id
        }

        // Store in database
        const { error: insertError } = await supabase
            .from('live_logs')
            .insert({
                raw: logEntry.raw,
                source: logEntry.source,
                source_ip: logEntry.source_ip,
                severity: logEntry.severity,
                threat_type: logEntry.threat_type,
                description: logEntry.description,
                user_id: logEntry.user_id
            })

        if (insertError) {
            console.error('Insert error:', insertError)
            // Continue anyway - SSE broadcast is more important
        }

        // Broadcast to SSE clients via live-stream endpoint
        // We'll use the existing live-stream POST internally
        try {
            const liveStreamUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/live-stream`
            await fetch(liveStreamUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: logEntry.id,
                    message: logEntry.raw,
                    source: logEntry.source,
                    ip: logEntry.source_ip,
                    severity: logEntry.severity,
                    threat_type: logEntry.threat_type,
                    timestamp: logEntry.timestamp
                })
            })
        } catch (sseError) {
            console.error('SSE broadcast error:', sseError)
        }

        return NextResponse.json({
            success: true,
            id: logEntry.id,
            severity: logEntry.severity,
            threat_type: logEntry.threat_type
        }, { status: 201 })

    } catch (error: any) {
        console.error('Ingest Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

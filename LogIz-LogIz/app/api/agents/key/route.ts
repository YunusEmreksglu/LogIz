import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Service role client for bypassing RLS when needed
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Generate secure API key
function generateApiKey(): string {
    return 'sk_' + randomBytes(24).toString('hex')
}

export async function GET(request: NextRequest) {
    try {
        // Get user from auth header or session
        const authHeader = request.headers.get('authorization')

        // For now, use a simple user ID from query or header
        // In production, this should be from Supabase Auth session
        const userId = request.nextUrl.searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        // Check for existing active key
        const { data: existingKey, error: fetchError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single()

        if (existingKey) {
            return NextResponse.json({
                key: existingKey.key,
                name: existingKey.name,
                created_at: existingKey.created_at
            })
        }

        // Create new key if none exists
        const newKey = generateApiKey()
        const { data: createdKey, error: createError } = await supabase
            .from('api_keys')
            .insert({
                id: randomUUID(),
                key: newKey,
                name: 'Default Agent Key',
                user_id: userId,
                is_active: true
            })
            .select()
            .single()

        if (createError) {
            console.error('Create key error:', createError)
            return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        return NextResponse.json({
            key: createdKey.key,
            name: createdKey.name,
            created_at: createdKey.created_at
        })

    } catch (error: any) {
        console.error('API Key GET Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const userId = body.userId

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        // Deactivate existing keys
        await supabase
            .from('api_keys')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('is_active', true)

        // Create new key
        const newKey = generateApiKey()
        const { data: createdKey, error: createError } = await supabase
            .from('api_keys')
            .insert({
                id: randomUUID(),
                key: newKey,
                name: 'Reset Agent Key',
                user_id: userId,
                is_active: true
            })
            .select()
            .single()

        if (createError) {
            console.error('Reset key error:', createError)
            return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        return NextResponse.json({
            key: createdKey.key,
            name: createdKey.name,
            created_at: createdKey.created_at
        })

    } catch (error: any) {
        console.error('API Key POST Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

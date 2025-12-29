import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user using Service Role Key to bypass RLS
    const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      : supabase

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Registration might fail due to RLS policies.')
    }

    const { data: user, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: randomUUID(),
        email,
        password: hashedPassword,
        name: name || null,
        role: 'USER',
        updated_at: new Date().toISOString()
      })
      .select('id, email, name, role')
      .single()

    if (createError || !user) {
      throw createError || new Error('Failed to create user')
    }

    return NextResponse.json({
      success: true,
      user,
      message: 'Account created successfully'
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account', details: String(error) },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (default 50MB)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '52428800')
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds limit' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['.log', '.txt', '.csv', '.json']
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowedTypes.includes(fileExt)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadDir = process.env.UPLOAD_DIR
      ? join(process.cwd(), process.env.UPLOAD_DIR)
      : join(process.cwd(), 'public', 'uploads')

    const filePath = join(uploadDir, filename)

    await writeFile(filePath, buffer)

    // Get userId from session (if logged in)
    // Use Service Role client to bypass RLS for server-side processing
    const { createClient } = await import('@supabase/supabase-js')
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

    // Get userId from session (if logged in)
    const session = await getServerSession(authOptions)
    let userId = session?.user?.id || null

    // Check if user actually exists in DB (to handle stale sessions)
    if (userId) {
      const { data: userExists } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      if (!userExists) {
        console.warn(`Stale session detected: User ID ${userId} not found in DB. Treating as anonymous upload.`)
        userId = null
      }
    }

    // If no valid user, use anonymous placeholder or skip user_id
    // Note: log_files.user_id should be nullable in schema for anonymous uploads
    // Build insert object conditionally
    const insertData: any = {
      id: randomUUID(),
      filename,
      original_name: file.name,
      file_path: `/uploads/${filename}`,
      file_size: file.size,
      file_type: fileExt,
      status: 'PENDING',
    }

    // Only include user_id if it's not null
    if (userId) {
      insertData.user_id = userId
    }

    const { data: logFile, error } = await supabaseAdmin
      .from('log_files')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error (Admin):', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      logFile: {
        id: logFile.id,
        filename: logFile.original_name,
        size: logFile.file_size,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

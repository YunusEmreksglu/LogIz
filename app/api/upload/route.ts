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
    const session = await getServerSession(authOptions)
    // Note: If allow guest uploads, ensure your Supabase 'log_files.user_id' column is nullable or references a guest account.
    // The previous code generated a 'guest-...' ID which will fail FK constraints if not handled in DB.
    const userId = session?.user?.id || `guest-${timestamp}`

    const { data: logFile, error } = await supabase
      .from('log_files')
      .insert({
        id: randomUUID(),
        filename,
        original_name: file.name,
        file_path: `/uploads/${filename}`,
        file_size: file.size,
        file_type: fileExt,
        status: 'PENDING',
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
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

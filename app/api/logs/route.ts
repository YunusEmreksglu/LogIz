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

    const { data: logFilesData, error } = await supabaseAdmin
      .from('log_files')
      .select(`
        *,
        analyses (
          *,
          threats (*)
        )
      `)
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // Map Supabase snake_case to camelCase to maintain compatibility with existing frontend
    const logFiles = (logFilesData || []).map(file => ({
      ...file,
      id: file.id,
      filename: file.filename,
      originalName: file.original_name,
      filePath: file.file_path,
      fileSize: file.file_size,
      fileType: file.file_type,
      status: file.status,
      uploadedAt: file.uploaded_at,
      userId: file.user_id,
      analyses: (file.analyses || []).map((analysis: any) => ({
        ...analysis,
        id: analysis.id,
        result: analysis.result,
        threatCount: analysis.threat_count,
        highSeverity: analysis.high_severity,
        mediumSeverity: analysis.medium_severity,
        lowSeverity: analysis.low_severity,
        status: analysis.status,
        analyzedAt: analysis.analyzed_at,
        processingTime: analysis.processing_time,
        logFileId: analysis.log_file_id,
        threats: analysis.threats // threats inside likely match enough or aren't deeply used here
      }))
    }))

    return NextResponse.json({ logFiles })
  } catch (error) {
    console.error('Logs fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}

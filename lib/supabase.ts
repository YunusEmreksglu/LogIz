import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmavagzxznmmwecbudux.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYXZhZ3p4em5tbXdlY2J1ZHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDAwMzksImV4cCI6MjA3ODI3NjAzOX0.mkHQy0e3LN0hZfxEmnin5dpgycWJ6NHOp5fltrFUQF8'

if (!supabaseKey) {
    console.warn('⚠️ Supply a SUPABASE_KEY to use the Supabase client.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

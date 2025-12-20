import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string }
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    const { error } = await supabase
      .from('images')
      .insert({ url })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to save image URL' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Save error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save image' },
      { status: 500 }
    )
  }
}


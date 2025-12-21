import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL

if (!WORKER_URL) {
  throw new Error('Missing CLOUDFLARE_WORKER_URL environment variable')
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const filename = formData.get('filename') as string

    if (!file || !filename) {
      return NextResponse.json({ error: 'File and filename are required' }, { status: 400 })
    }

    // Upload to Cloudflare Worker with custom filename
    const arrayBuffer = await file.arrayBuffer()
    const response = await fetch(`${WORKER_URL}/${filename}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/webp',
      },
      body: arrayBuffer,
    })

    if (!response.ok) {
      let errorMessage = 'Failed to upload image'
      try {
        const errorData = await response.json() as { error?: string }
        errorMessage = errorData.error || errorMessage
      } catch {
        // Use default errorMessage
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    // Worker returns JSON with url and filename
    const workerResponse = (await response.json()) as { url: string; filename: string }
    const publicUrl = workerResponse.url || `${WORKER_URL}/${filename}`

    // Save URL to database
    const { error: dbError } = await supabase
      .from('images')
      .insert({ url: publicUrl })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save image URL' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl, filename })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to upload image' },
      { status: 500 }
    )
  }
}


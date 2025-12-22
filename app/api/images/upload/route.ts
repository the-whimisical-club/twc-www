import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ensureUser, isUserApproved } from '@/app/utils/users'

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
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'UPLOAD_001',
        message: 'User authentication required'
      }, { status: 401 })
    }

    // Check if user is approved (exists in users table)
    const approved = await isUserApproved(user.id)
    if (!approved) {
      return NextResponse.json({ 
        error: 'User not approved', 
        code: 'UPLOAD_002',
        message: 'User account is pending approval'
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const providedFilename = formData.get('filename') as string | null

    if (!file) {
      return NextResponse.json({ 
        error: 'File is required', 
        code: 'UPLOAD_003',
        message: 'No file provided in request'
      }, { status: 400 })
    }

    // Detect file type (handle JPEG fallback from iOS)
    const fileType = file.type || 'image/webp'
    const isJPEG = fileType.includes('jpeg') || fileType.includes('jpg')
    const extension = isJPEG ? '.jpg' : '.webp'
    const contentType = isJPEG ? 'image/jpeg' : 'image/webp'

    // Generate filename with folder structure: username/dd-mm-yyyy-random.webp or .jpg
    let filename: string
    if (providedFilename && providedFilename.includes('/')) {
      // Use provided filename if it already has folder structure
      // Ensure extension matches file type
      filename = providedFilename.replace(/\.(webp|jpg|jpeg)$/i, extension)
    } else {
      // Generate filename server-side with folder structure
      const now = new Date()
      const dd = String(now.getDate()).padStart(2, '0')
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const yyyy = now.getFullYear()
      
      // Extract username from email (part before @)
      const username = user.email!.split('@')[0] || user.email!
      
      // Sanitize username (remove special chars, keep alphanumeric, replace with dash)
      const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      
      // Generate 10-character alphanumeric random sequence
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let randomSequence = ''
      for (let i = 0; i < 10; i++) {
        randomSequence += chars[Math.floor(Math.random() * chars.length)]
      }
      
      // Format: username/dd-mm-yyyy-random.webp or .jpg
      filename = `${sanitizedUsername}/${dd}-${mm}-${yyyy}-${randomSequence}${extension}`
    }

    // Upload to Cloudflare Worker with filename including folder structure
    const arrayBuffer = await file.arrayBuffer()
    const response = await fetch(`${WORKER_URL}/${filename}`, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: arrayBuffer,
    })

    if (!response.ok) {
      let errorMessage = 'Failed to upload image'
      let errorCode = 'UPLOAD_004'
      try {
        const errorData = await response.json() as { error?: string; code?: string }
        errorMessage = errorData.error || errorMessage
        errorCode = errorData.code || errorCode
      } catch {
        // Use default errorMessage
      }
      return NextResponse.json({ 
        error: errorMessage,
        code: errorCode,
        message: 'Cloudflare Worker upload failed'
      }, { status: response.status })
    }

    // Worker returns JSON with url and filename
    const workerResponse = (await response.json()) as { url: string; filename: string }
    const publicUrl = workerResponse.url || `${WORKER_URL}/${filename}`

    // Ensure user exists in users table and get their id
    const userRecord = await ensureUser(user.id, user.email)
    
    if (!userRecord) {
      return NextResponse.json({ 
        error: 'Failed to create user record', 
        code: 'UPLOAD_005',
        message: 'Could not create or retrieve user record in database'
      }, { status: 500 })
    }

    // Save URL to database with user_id
    const { error: dbError } = await supabase
      .from('images')
      .insert({ url: publicUrl, user_id: userRecord.id })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        error: 'Failed to save image URL', 
        code: 'UPLOAD_006',
        message: 'Database insert failed',
        details: dbError.message
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl, filename })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : 'Failed to upload image',
        code: 'UPLOAD_007',
        message: 'Unexpected server error occurred'
      },
      { status: 500 }
    )
  }
}


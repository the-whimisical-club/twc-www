import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ensureUser, isUserApproved } from '@/app/utils/users'
import { spawn } from 'child_process'
import { join } from 'path'

// Configure body size limit for this route (15MB to allow buffer above 10MB worker limit)
export const maxDuration = 60 // 60 seconds timeout
export const runtime = 'nodejs'

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

    // Parse FormData with error handling for body size limits
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      // Check if it's a body size limit error
      if (errorMessage.includes('body') && errorMessage.includes('exceeded') || 
          errorMessage.includes('Failed to parse body as FormData') ||
          errorMessage.includes('MB')) {
        return NextResponse.json({ 
          error: 'File too large for upload', 
          code: 'UPLOAD_008',
          message: 'File exceeds 100MB limit. Please use a smaller image.'
        }, { status: 413 })
      }
      // Generic FormData parsing error
      return NextResponse.json({ 
        error: 'Failed to process upload request', 
        code: 'UPLOAD_009',
        message: `Request processing failed: ${errorMessage}`
      }, { status: 400 })
    }

    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ 
        error: 'File is required', 
        code: 'UPLOAD_003',
        message: 'No file provided in request'
      }, { status: 400 })
    }

    // Check file size before processing (100MB limit)
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large', 
        code: 'UPLOAD_008',
        message: 'File size exceeds 100MB limit. Please use a smaller image.'
      }, { status: 413 })
    }

    // Process image with Python script (simple and reliable)
    let processedImageBuffer: Buffer
    try {
      const imageBuffer = Buffer.from(await file.arrayBuffer())
      const scriptPath = join(process.cwd(), 'scripts', 'process_image.py')
      const venvPython = join(process.cwd(), 'venv', 'bin', 'python3')
      
      // Run Python script with image data as stdin (use venv Python)
      const processed = await new Promise<{ stdout: Buffer; stderr: string }>((resolve, reject) => {
        const python = spawn(venvPython, [scriptPath])
        const stdoutChunks: Buffer[] = []
        const stderrChunks: string[] = []
        
        python.stdout.on('data', (chunk: Buffer) => {
          stdoutChunks.push(chunk)
        })
        
        python.stderr.on('data', (chunk: Buffer) => {
          stderrChunks.push(chunk.toString())
        })
        
        python.on('close', (code) => {
          const stderr = stderrChunks.join('')
          if (code !== 0) {
            if (stderr.includes('RESOLUTION_TOO_LOW')) {
              reject(new Error('RESOLUTION_TOO_LOW'))
            } else {
              reject(new Error(`Python script failed with code ${code}: ${stderr}`))
            }
            return
          }
          resolve({
            stdout: Buffer.concat(stdoutChunks),
            stderr
          })
        })
        
        python.on('error', (err) => {
          reject(new Error(`Failed to spawn Python: ${err.message}`))
        })
        
        // Write image buffer to stdin
        python.stdin.write(imageBuffer)
        python.stdin.end()
      })
      
      processedImageBuffer = processed.stdout
      
      // Log what we got from Python
      const firstBytes = Array.from(processedImageBuffer.slice(0, 12))
        .map(b => '0x' + b.toString(16).padStart(2, '0'))
        .join(' ')
      const isJpeg = processedImageBuffer[0] === 0xFF && processedImageBuffer[1] === 0xD8
      const isWebP = processedImageBuffer[0] === 0x52 && 
                     processedImageBuffer[1] === 0x49 && 
                     processedImageBuffer[2] === 0x46 && 
                     processedImageBuffer[3] === 0x46
      
      console.log('Python script output:', {
        size: processedImageBuffer.length,
        firstBytes,
        isJpeg,
        isWebP,
        format: isJpeg ? 'JPEG' : isWebP ? 'WEBP' : 'UNKNOWN'
      })
      
      // Verify it's actually JPEG
      if (!isJpeg) {
        if (isWebP) {
          throw new Error('Python script output WebP instead of JPEG! This should not happen.')
        }
        throw new Error(`Python script did not output valid JPEG. First bytes: ${firstBytes}`)
      }
    } catch (err) {
      console.error('Image processing error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Image processing failed'
      
      // Check if it's a resolution error
      if (errorMessage.includes('RESOLUTION_TOO_LOW')) {
        return NextResponse.json({ 
          error: 'Resolution too low', 
          code: 'UPLOAD_010',
          message: 'Image resolution must be at least 1080p'
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to process image', 
        code: 'UPLOAD_011',
        message: errorMessage
      }, { status: 400 })
    }

    // All processed images are JPEG
    const extension = '.jpg'
    const contentType = 'image/jpeg'

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
    
    // Format: username/dd-mm-yyyy-random.jpg
    const filename = `${sanitizedUsername}/${dd}-${mm}-${yyyy}-${randomSequence}${extension}`

    // Upload to Cloudflare Worker with filename including folder structure
    // Encode each path segment separately to preserve folder structure
    const encodedFilename = filename.split('/').map(segment => encodeURIComponent(segment)).join('/')
    
    // Verify buffer before sending
    const bufferToSend = new Uint8Array(processedImageBuffer)
    const verifyBytes = Array.from(bufferToSend.slice(0, 4))
      .map(b => '0x' + b.toString(16).padStart(2, '0'))
      .join(' ')
    const isJpegBeforeSend = bufferToSend[0] === 0xFF && bufferToSend[1] === 0xD8
    
    console.log('Sending to worker:', {
      filename,
      bufferSize: bufferToSend.length,
      firstBytes: verifyBytes,
      isJpeg: isJpegBeforeSend,
      contentType
    })
    
    const workerUrl = `${WORKER_URL}/${encodedFilename}`
    const response = await fetch(workerUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: bufferToSend,
    })

    if (!response.ok) {
      let errorMessage = 'Failed to upload image'
      let errorCode = 'UPLOAD_004'
      let errorDetails = ''
      try {
        const errorData = await response.json() as { error?: string; code?: string; message?: string }
        errorMessage = errorData.error || errorMessage
        errorCode = errorData.code || errorCode
        errorDetails = errorData.message || ''
      } catch {
        // If response isn't JSON, get text
        try {
          const text = await response.text()
          errorDetails = text || `HTTP ${response.status}`
        } catch {
          errorDetails = `HTTP ${response.status}`
        }
      }
      console.error('Worker upload failed:', {
        status: response.status,
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
        filename,
        contentType,
        fileSize: file.size
      })
      return NextResponse.json({ 
        error: errorMessage,
        code: errorCode,
        message: errorDetails || 'Cloudflare Worker upload failed'
      }, { status: response.status >= 400 && response.status < 500 ? response.status : 400 })
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


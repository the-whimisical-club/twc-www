import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ensureUser, isUserApproved } from '@/app/utils/users'
import sharp from 'sharp'

// Configure body size limit for this route (15MB to allow buffer above 10MB worker limit)
export const maxDuration = 60 // 60 seconds timeout
export const runtime = 'nodejs'

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL

if (!WORKER_URL) {
  throw new Error('Missing CLOUDFLARE_WORKER_URL environment variable')
}

// Helper function to add CORS headers to responses
function jsonResponse(data: any, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    },
  })
}

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
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
      return jsonResponse({ 
        error: 'Unauthorized', 
        code: 'UPLOAD_001',
        message: 'User authentication required'
      }, 401)
    }

    // Check if user is approved (exists in users table)
    const approved = await isUserApproved(user.id)
    if (!approved) {
      return jsonResponse({ 
        error: 'User not approved', 
        code: 'UPLOAD_002',
        message: 'User account is pending approval'
      }, 403)
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
        return jsonResponse({ 
          error: 'File too large for upload', 
          code: 'UPLOAD_008',
          message: 'File exceeds 100MB limit. Please use a smaller image.'
        }, 413)
      }
      // Generic FormData parsing error
      return jsonResponse({ 
        error: 'Failed to process upload request', 
        code: 'UPLOAD_009',
        message: `Request processing failed: ${errorMessage}`
      }, 400)
    }

    const file = formData.get('image') as File

    if (!file) {
      return jsonResponse({ 
        error: 'File is required', 
        code: 'UPLOAD_003',
        message: 'No file provided in request'
      }, 400)
    }

    // Check file size before processing (100MB limit)
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse({ 
        error: 'File too large', 
        code: 'UPLOAD_008',
        message: 'File size exceeds 100MB limit. Please use a smaller image.'
      }, 413)
    }

    // Process image with Sharp (works in serverless environments like Vercel)
    let processedImageBuffer: Buffer
    try {
      const imageBuffer = Buffer.from(await file.arrayBuffer())
      
      // Constants for resolution checks
      const RES_1080P_WIDTH = 1920
      const RES_1080P_HEIGHT = 1080
      const RES_4K_WIDTH = 3840
      const RES_4K_HEIGHT = 2160
      
      // Check if file is already JPEG/JPG
      const isAlreadyJpeg = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8
      const fileExtension = file.name.toLowerCase().split('.').pop()
      const isJpegFile = fileExtension === 'jpg' || fileExtension === 'jpeg'
      
      // Load image and get metadata (Sharp auto-handles EXIF orientation)
      const image = sharp(imageBuffer)
      const metadata = await image.metadata()
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Could not read image dimensions')
      }
      
      let width = metadata.width
      let height = metadata.height
      
      // Check if resolution is less than 1080p
      if (width < RES_1080P_WIDTH && height < RES_1080P_HEIGHT) {
        return jsonResponse({ 
          error: 'Resolution too low', 
          code: 'UPLOAD_010',
          message: 'Image resolution must be at least 1080p'
        }, 400)
      }
      
      // Check if needs resizing (only if > 4K/2160p)
      const needsResize = width > RES_4K_WIDTH || height > RES_4K_HEIGHT
      
      // If already JPEG/JPG and doesn't need resizing, pass through (but still handle EXIF)
      if ((isAlreadyJpeg || isJpegFile) && !needsResize) {
        // Still process through Sharp to handle EXIF orientation, but output as-is
        processedImageBuffer = await image
          .jpeg({ 
            quality: 95, 
            mozjpeg: true 
          })
          .toBuffer()
        
        console.log('JPEG file passed through (EXIF handled):', {
          originalSize: imageBuffer.length,
          processedSize: processedImageBuffer.length,
          dimensions: `${width}x${height}`,
          format: 'JPEG'
        })
      } else {
        // Build processing pipeline for non-JPEG or files needing resizing
        let pipeline = image
        
        if (needsResize) {
          // Calculate scale to fit within 4K
          const scale = Math.min(RES_4K_WIDTH / width, RES_4K_HEIGHT / height)
          const newWidth = Math.round(width * scale)
          const newHeight = Math.round(height * scale)
          pipeline = pipeline.resize(newWidth, newHeight, {
            kernel: sharp.kernel.lanczos3
          })
        }
        
        // Convert to JPEG (always JPEG, quality 95, optimized)
        processedImageBuffer = await pipeline
          .jpeg({ 
            quality: 95, 
            mozjpeg: true 
          })
          .toBuffer()
        
        console.log('Image processed with Sharp:', {
          originalSize: imageBuffer.length,
          processedSize: processedImageBuffer.length,
          originalDimensions: `${metadata.width}x${metadata.height}`,
          processedDimensions: needsResize ? `${Math.round(width * Math.min(RES_4K_WIDTH / width, RES_4K_HEIGHT / height))}x${Math.round(height * Math.min(RES_4K_WIDTH / width, RES_4K_HEIGHT / height))}` : `${width}x${height}`,
          wasResized: needsResize,
          wasConverted: !isAlreadyJpeg && !isJpegFile,
          format: 'JPEG'
        })
      }
      
      // Verify it's actually JPEG (check magic bytes: FF D8)
      const isJpeg = processedImageBuffer[0] === 0xFF && processedImageBuffer[1] === 0xD8
      if (!isJpeg) {
        const firstBytes = Array.from(processedImageBuffer.slice(0, 4))
          .map(b => '0x' + b.toString(16).padStart(2, '0'))
          .join(' ')
        throw new Error(`Image processing did not output valid JPEG. First bytes: ${firstBytes}`)
      }
    } catch (err) {
      console.error('Image processing error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Image processing failed'
      
      // Check if it's a resolution error (shouldn't happen here, but just in case)
      if (errorMessage.includes('Resolution too low') || errorMessage.includes('RESOLUTION_TOO_LOW')) {
        return jsonResponse({ 
          error: 'Resolution too low', 
          code: 'UPLOAD_010',
          message: 'Image resolution must be at least 1080p'
        }, 400)
      }
      
      return jsonResponse({ 
        error: 'Failed to process image', 
        code: 'UPLOAD_011',
        message: errorMessage
      }, 400)
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
      return jsonResponse({ 
        error: errorMessage,
        code: errorCode,
        message: errorDetails || 'Cloudflare Worker upload failed'
      }, response.status >= 400 && response.status < 500 ? response.status : 400)
    }

    // Worker returns JSON with url and filename
    const workerResponse = (await response.json()) as { url: string; filename: string }
    const publicUrl = workerResponse.url || `${WORKER_URL}/${filename}`

    // Ensure user exists in users table and get their id
    const userRecord = await ensureUser(user.id, user.email)
    
    if (!userRecord) {
      return jsonResponse({ 
        error: 'Failed to create user record', 
        code: 'UPLOAD_005',
        message: 'Could not create or retrieve user record in database'
      }, 500)
    }

    // Save URL to database with user_id
    const { error: dbError } = await supabase
      .from('images')
      .insert({ url: publicUrl, user_id: userRecord.id })

    if (dbError) {
      console.error('Database error:', dbError)
      return jsonResponse({ 
        error: 'Failed to save image URL', 
        code: 'UPLOAD_006',
        message: 'Database insert failed',
        details: dbError.message
      }, 500)
    }

    return jsonResponse({ success: true, url: publicUrl, filename })
  } catch (err) {
    console.error('Upload error:', err)
    return jsonResponse(
      { 
        error: err instanceof Error ? err.message : 'Failed to upload image',
        code: 'UPLOAD_007',
        message: 'Unexpected server error occurred'
      },
      500
    )
  }
}


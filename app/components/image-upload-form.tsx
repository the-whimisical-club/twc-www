'use client'

import { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { useRouter } from 'next/navigation'

export interface ImageUploadFormHandle {
  triggerFileSelect: () => void
  getUploadState: () => { uploading: boolean; progress: number; success: boolean }
}

// Handle EXIF orientation for iOS images
function getOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer)
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(-2) // Not a JPEG
        return
      }
      const length = view.byteLength
      let offset = 2
      while (offset < length) {
        if (view.getUint16(offset, false) === 0xFFE1) {
          const marker = view.getUint16(offset + 2, false)
          if (marker === 0xE1) {
            if (view.getUint32(offset + 4, false) !== 0x45786966) {
              resolve(-1)
              return
            }
            const little = view.getUint16(offset + 10, false) === 0x4949
            const count = little ? view.getUint16(offset + 18, false) : view.getUint16(offset + 18, false)
            for (let i = 0; i < count; i++) {
              const entryOffset = offset + 20 + i * 12
              const tag = little ? view.getUint16(entryOffset, true) : view.getUint16(entryOffset, false)
              if (tag === 0x0112) {
                const orientation = little ? view.getUint16(entryOffset + 8, true) : view.getUint16(entryOffset + 8, false)
                resolve(orientation)
                return
              }
            }
          }
        }
        offset += 2 + (view.getUint16(offset, false) & 0xFFFF)
      }
      resolve(-1)
    }
    reader.onerror = () => resolve(-1)
    const blob = file.slice(0, 64 * 1024) // Read first 64KB
    reader.readAsArrayBuffer(blob)
  })
}

// Apply EXIF orientation to canvas
function applyOrientation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, orientation: number) {
  const width = canvas.width
  const height = canvas.height

  if (orientation > 4) {
    canvas.width = height
    canvas.height = width
  }

  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, width, 0)
      break
    case 3:
      ctx.transform(-1, 0, 0, -1, width, height)
      break
    case 4:
      ctx.transform(1, 0, 0, -1, 0, height)
      break
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0)
      break
    case 6:
      ctx.transform(0, 1, -1, 0, height, 0)
      break
    case 7:
      ctx.transform(0, -1, -1, 0, height, width)
      break
    case 8:
      ctx.transform(0, -1, 1, 0, 0, width)
      break
  }
}

// Resolution constants
const RES_1080P_WIDTH = 1920
const RES_1080P_HEIGHT = 1080
const RES_4K_WIDTH = 3840
const RES_4K_HEIGHT = 2160

// Custom error for resolution rejection
export class ResolutionError extends Error {
  code = 'RESOLUTION_TOO_LOW'
  constructor() {
    super('Image resolution is less than 1080p')
  }
}

// Process image: check resolution, resize if needed, convert to JPEG
async function processImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const img = new Image()
        
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              reject(new Error('Failed to get canvas context'))
              return
            }

            // Get EXIF orientation for iOS images (needed for accurate resolution check)
            const orientation = await getOrientation(file)
            
            // Get source dimensions
            let sourceWidth = img.width
            let sourceHeight = img.height
            const isRotated = orientation > 4
            
            // Calculate final output dimensions (after orientation)
            let finalWidth = isRotated ? sourceHeight : sourceWidth
            let finalHeight = isRotated ? sourceWidth : sourceHeight
            
            // Step 1: If resolution < 1080p, reject
            if (finalWidth < RES_1080P_WIDTH && finalHeight < RES_1080P_HEIGHT) {
              reject(new ResolutionError())
              return
            }
            
            // Check if image is already JPEG
            const isAlreadyJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg' || 
                                   file.name.toLowerCase().endsWith('.jpg') || 
                                   file.name.toLowerCase().endsWith('.jpeg')
            
            // Check if needs resizing (only if > 4K/2160p)
            const needsResize = finalWidth > RES_4K_WIDTH || finalHeight > RES_4K_HEIGHT
            
            // Check if needs orientation fix
            const needsOrientationFix = orientation !== 1 && orientation !== -1 && orientation !== -2
            
            // Step 2: If resolution > 2160p (4K), resize/compress (requires canvas)
            // Step 3: If not JPEG, convert (requires canvas)
            // Also need canvas if orientation needs fixing
            const needsProcessing = needsResize || !isAlreadyJpeg || needsOrientationFix
            
            // If no processing needed, return original file
            // This includes JPEGs between 1440p and 2160p (4K) - upload normally
            if (!needsProcessing) {
              resolve(file)
              return
            }
            
            // Process through canvas (for resizing, format conversion, or orientation fix)
            // Calculate target dimensions
            let targetWidth = sourceWidth
            let targetHeight = sourceHeight
            
            // If resolution is greater than 4K (2160p), resize down to 4K (maintain aspect ratio)
            if (needsResize) {
              const scale = Math.min(
                RES_4K_WIDTH / finalWidth,
                RES_4K_HEIGHT / finalHeight
              )
              targetWidth = Math.round(sourceWidth * scale)
              targetHeight = Math.round(sourceHeight * scale)
            }
            
            // Set canvas dimensions (before orientation transform)
            canvas.width = targetWidth
            canvas.height = targetHeight

            // Apply orientation transformation (this may swap dimensions if orientation > 4)
            ctx.save()
            applyOrientation(canvas, ctx, orientation)
            
            // Draw image at target size
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
            ctx.restore()

            // Convert to JPEG with high quality (0.95 quality)
            // Use toDataURL instead of toBlob to ensure JPEG format (some browsers default toBlob to WebP)
            try {
              const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
              const base64Data = dataUrl.split(',')[1]
              if (!base64Data) {
                const error = new Error('Failed to convert image to JPEG. Please try a different image.') as Error & { code?: string }
                error.code = 'CLIENT_001'
                reject(error)
                return
              }
              const byteString = atob(base64Data)
              const ab = new ArrayBuffer(byteString.length)
              const ia = new Uint8Array(ab)
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i)
              }
              const jpegBlob = new Blob([ab], { type: 'image/jpeg' })
              resolve(jpegBlob)
            } catch (err) {
              const error = new Error('Failed to convert image to JPEG. Please try a different image.') as Error & { code?: string }
              error.code = 'CLIENT_001'
              reject(error)
            }
          } catch (err) {
            if (err instanceof ResolutionError) {
              reject(err)
            } else {
              const error = new Error(`Image processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`) as Error & { code?: string }
              error.code = 'CLIENT_002'
              reject(error)
            }
          }
        }
        
        img.onerror = () => {
          const error = new Error('Failed to load image. Please try a different image format.') as Error & { code?: string }
          error.code = 'CLIENT_003'
          reject(error)
        }
        
        img.src = e.target?.result as string
      } catch (err) {
        if (err instanceof ResolutionError) {
          reject(err)
        } else {
          reject(new Error(`Failed to process image: ${err instanceof Error ? err.message : 'Unknown error'}`))
        }
      }
    }
    reader.onerror = () => {
      const error = new Error('Failed to read file') as Error & { code?: string }
      error.code = 'CLIENT_004'
      reject(error)
    }
    reader.readAsDataURL(file)
  })
}

interface ImageUploadFormProps {
  onStateChange?: (state: { uploading: boolean; progress: number; success: boolean }) => void
}

const ImageUploadForm = forwardRef<ImageUploadFormHandle, ImageUploadFormProps>((props, ref) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; code?: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useImperativeHandle(ref, () => ({
    triggerFileSelect: () => {
      fileInputRef.current?.click()
    },
    getUploadState: () => ({ uploading, progress, success }),
  }))

  const notifyStateChange = (state: { uploading: boolean; progress: number; success: boolean }) => {
    props.onStateChange?.(state)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const resetState = () => {
      setUploading(true)
      setProgress(0)
      setSuccess(false)
      setMessage(null)
      notifyStateChange({ uploading: true, progress: 0, success: false })
    }
    resetState()

    try {
      // Process image: check resolution, resize if needed, convert to JPEG
      setProgress(5)
      notifyStateChange({ uploading: true, progress: 5, success: false })
      const jpegBlob = await processImage(file)
      
      // Server will generate filename from user session
      const filename = `temp-${Date.now()}.jpg` // Temporary filename, server will replace it
      
      setProgress(10)
      notifyStateChange({ uploading: true, progress: 10, success: false })

      // Use XMLHttpRequest for all browsers - most reliable for file uploads
      // Safari has known issues with fetch + FormData ("Body is disturbed or locked")
      const formData = new FormData()
      formData.append('image', jpegBlob, filename)

      // Use XMLHttpRequest for all browsers - most reliable for file uploads
      // Safari has known issues with fetch + FormData ("Body is disturbed or locked")
      const xhr = new XMLHttpRequest()

      // Upload via API route (which handles Worker upload and DB save)
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          // Map progress from 10-100% (since conversion takes first 10%)
          const uploadProgress = (event.loaded / event.total) * 90
          const totalProgress = 10 + uploadProgress
          setProgress(totalProgress)
          notifyStateChange({ uploading: true, progress: totalProgress, success: false })
        }
      })

      const uploadPromise = new Promise<{ url: string; filename: string }>((resolve, reject) => {
        // Add timeout (60 seconds)
        const timeout = setTimeout(() => {
          xhr.abort()
          const error = new Error('Upload timeout - file may be too large') as Error & { code?: string }
          error.code = 'CLIENT_008'
          reject(error)
        }, 60000)

        xhr.addEventListener('load', () => {
          clearTimeout(timeout)
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText) as { url: string; filename: string }
              resolve(data)
            } catch (err) {
              const error = new Error('Failed to parse response') as Error & { code?: string }
              error.code = 'CLIENT_005'
              reject(error)
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText) as { error?: string; code?: string; message?: string }
              const error = new Error(errorData.error || `Upload failed (${xhr.status})`) as Error & { code?: string; message?: string }
              error.code = errorData.code || 'CLIENT_006'
              error.message = errorData.message || error.message
              reject(error)
            } catch {
              const error = new Error(`Upload failed (HTTP ${xhr.status})`) as Error & { code?: string }
              error.code = 'CLIENT_006'
              reject(error)
            }
          }
        })

        xhr.addEventListener('error', () => {
          clearTimeout(timeout)
          const error = new Error('Network error') as Error & { code?: string }
          error.code = 'CLIENT_007'
          reject(error)
        })

        xhr.addEventListener('abort', () => {
          clearTimeout(timeout)
          const error = new Error('Upload cancelled or timed out') as Error & { code?: string }
          error.code = 'CLIENT_008'
          reject(error)
        })

        xhr.open('POST', '/api/images/upload')
        // Don't set Content-Type - let browser set it with boundary for FormData
        // This is critical for Safari to work properly
        xhr.send(formData)
      })

      const { url } = await uploadPromise

      // Both paths set url, now continue with success handling

      setProgress(100)
      setSuccess(true)
      notifyStateChange({ uploading: false, progress: 100, success: true })
      setMessage({ type: 'success', text: 'Image uploaded successfully!' })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Redirect to feed after a short delay
      setTimeout(() => {
        router.push('/feed')
      }, 1000)
    } catch (err) {
      // Handle resolution error - redirect to /bruh
      if (err instanceof ResolutionError) {
        setUploading(false)
        setProgress(0)
        setSuccess(false)
        notifyStateChange({ uploading: false, progress: 0, success: false })
        router.push('/bruh')
        return
      }
      
      setUploading(false)
      setProgress(0)
      setSuccess(false)
      notifyStateChange({ uploading: false, progress: 0, success: false })
      const errorCode = (err as Error & { code?: string })?.code || 'UNKNOWN'
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image'
      setMessage({ 
        type: 'error', 
        text: `${errorMessage} [${errorCode}]`,
        code: errorCode
      })
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        id="image"
        name="image"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />
      {message && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 p-3 rounded z-50 max-w-md ${
            message.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="font-medium">{message.text}</div>
          {message.code && message.type === 'error' && (
            <a 
              href="/errors" 
              className="text-xs mt-1 opacity-90 hover:opacity-100 underline cursor-pointer block"
            >
              Error Code: {message.code} | Click to see what this means
            </a>
          )}
        </div>
      )}
    </>
  )
})

ImageUploadForm.displayName = 'ImageUploadForm'

export default ImageUploadForm


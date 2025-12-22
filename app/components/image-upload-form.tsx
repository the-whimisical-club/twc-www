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

// Convert image to WebP format with iOS/HEIC support
async function convertToWebP(file: File): Promise<Blob> {
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

            // Get EXIF orientation for iOS images
            const orientation = await getOrientation(file)
            
            // Set canvas dimensions
            if (orientation > 4) {
              canvas.width = img.height
              canvas.height = img.width
            } else {
              canvas.width = img.width
              canvas.height = img.height
            }

            // Apply orientation transformation
            ctx.save()
            applyOrientation(canvas, ctx, orientation)
            ctx.drawImage(img, 0, 0)
            ctx.restore()

            // Try WebP conversion with fallback
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob)
                } else {
                  // Fallback: if WebP fails, try JPEG (iOS Safari sometimes fails silently)
                  canvas.toBlob(
                    (jpegBlob) => {
                      if (jpegBlob) {
                        resolve(jpegBlob)
                      } else {
                        const error = new Error('Failed to convert image. Please try a different image.') as Error & { code?: string }
                        error.code = 'CLIENT_001'
                        reject(error)
                      }
                    },
                    'image/jpeg',
                    0.9
                  )
                }
              },
              'image/webp',
              0.9 // Quality (0-1)
            )
          } catch (err) {
            const error = new Error(`Image processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`) as Error & { code?: string }
            error.code = 'CLIENT_002'
            reject(error)
          }
        }
        
        img.onerror = () => {
          // If image fails to load, try using the original file as fallback
          const error = new Error('Failed to load image. Please try a different image format.') as Error & { code?: string }
          error.code = 'CLIENT_003'
          reject(error)
        }
        
        img.src = e.target?.result as string
      } catch (err) {
        reject(new Error(`Failed to process image: ${err instanceof Error ? err.message : 'Unknown error'}`))
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

// Note: Filename generation is now handled server-side to include folder structure
// This function is kept for backward compatibility but won't be used
function generateFilename(originalFile: File, email: string): string {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  
  // Extract username from email (part before @)
  const username = email.split('@')[0] || email
  
  // Sanitize username (remove special chars, keep alphanumeric, replace with dash)
  const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
  
  // Generate 10-character alphanumeric random sequence
  // Use crypto if available for better randomness, otherwise fallback to Math.random
  const generateRandomSequence = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    const getRandomIndex = (max: number): number => {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint32Array(1)
        crypto.getRandomValues(array)
        return array[0]! % max
      }
      return Math.floor(Math.random() * max)
    }
    for (let i = 0; i < 10; i++) {
      result += chars[getRandomIndex(chars.length)]
    }
    return result
  }
  
  const randomSequence = generateRandomSequence()
  
  // Return format: username/dd-mm-yyyy-filename.webp (with folder structure)
  return `${sanitizedUsername}/${dd}-${mm}-${yyyy}-${randomSequence}.webp`
}

interface ImageUploadFormProps {
  onStateChange?: (state: { uploading: boolean; progress: number; success: boolean }) => void
  username?: string // Optional, server will generate filename if not provided
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
      // Convert to WebP
      setProgress(5)
      notifyStateChange({ uploading: true, progress: 5, success: false })
      const webpBlob = await convertToWebP(file)
      
      // Generate filename (server will regenerate with folder structure if username provided)
      // If username is not provided, server will generate filename from user session
      const filename = props.username 
        ? generateFilename(file, props.username)
        : `temp-${Date.now()}.webp` // Temporary filename, server will replace it
      
      setProgress(10)
      notifyStateChange({ uploading: true, progress: 10, success: false })

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('image', webpBlob, filename)
      // Only send filename if we have username, otherwise let server generate it
      if (props.username) {
        formData.append('filename', filename)
      }

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
        xhr.addEventListener('load', () => {
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
              const error = new Error(errorData.error || 'Upload failed') as Error & { code?: string; message?: string }
              error.code = errorData.code || 'CLIENT_006'
              error.message = errorData.message || error.message
              reject(error)
            } catch {
              const error = new Error('Upload failed') as Error & { code?: string }
              error.code = 'CLIENT_006'
              reject(error)
            }
          }
        })

        xhr.addEventListener('error', () => {
          const error = new Error('Network error') as Error & { code?: string }
          error.code = 'CLIENT_007'
          reject(error)
        })

        xhr.open('POST', '/api/images/upload')
        xhr.send(formData)
      })

      const { url } = await uploadPromise

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
            <div className="text-xs mt-1 opacity-90">
              Error Code: {message.code} | See docs/error_codes.mdx for details
            </div>
          )}
        </div>
      )}
    </>
  )
})

ImageUploadForm.displayName = 'ImageUploadForm'

export default ImageUploadForm


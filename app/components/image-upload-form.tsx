'use client'

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createError } from '@/app/utils/errors'
import { compressImage, needsCompression } from '@/app/utils/image-compression'

// Import the size limit constant
const MAX_UPLOAD_SIZE = 4 * 1024 * 1024 // 4MB - matches image-compression.ts

export interface ImageUploadFormHandle {
  triggerFileSelect: () => void
  getUploadState: () => { uploading: boolean; progress: number; success: boolean }
}

interface ImageUploadFormProps {
  onStateChange?: (state: { uploading: boolean; progress: number; success: boolean }) => void
}

const ImageUploadForm = forwardRef<ImageUploadFormHandle, ImageUploadFormProps>((props, ref) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)
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
      notifyStateChange({ uploading: true, progress: 0, success: false })
    }
    resetState()

    try {
      // Always check EXIF orientation for diagnostic purposes (even for small files)
      // This helps identify if EXIF reading is failing for specific users
      let detectedOrientation = 1
      try {
        const EXIF = (await import('exif-js')).default
        detectedOrientation = await new Promise<number>((resolve) => {
          EXIF.getData(file as any, function(this: any) {
            const orientation = EXIF.getTag(this, 'Orientation') || 1
            resolve(orientation)
          })
        })
        console.log('EXIF orientation detected (diagnostic):', {
          orientation: detectedOrientation,
          fileSize: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
          fileName: file.name
        })
      } catch (exifErr) {
        console.warn('Could not read EXIF orientation (diagnostic):', exifErr)
        // This is just for diagnostics - server will handle it
      }

      // Check if file is HEIC/HEIF (needs conversion)
      const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                     file.name.toLowerCase().endsWith('.heif') ||
                     file.type.toLowerCase().includes('heic') ||
                     file.type.toLowerCase().includes('heif')
      
      // Compress image if it's too large (to avoid platform payload limits)
      // HEIC files will be converted to JPEG first, then compressed if needed
      let fileToUpload = file
      if (needsCompression(file) || isHeic) {
        try {
          console.log('Client-side processing needed:', {
            originalSize: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
            fileName: file.name,
            fileType: file.type,
            isHeic: isHeic,
            exifOrientation: detectedOrientation
          })
          fileToUpload = await compressImage(file)
          
          // Verify compression actually reduced the size
          if (fileToUpload.size > MAX_UPLOAD_SIZE) {
            console.warn('Compression did not reduce file below limit:', {
              originalSize: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
              compressedSize: (fileToUpload.size / (1024 * 1024)).toFixed(2) + 'MB',
              limit: (MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(2) + 'MB'
            })
            // Still try to upload - server will handle it, but log the issue
          }
          
          console.log('Client-side compression completed:', {
            compressedSize: (fileToUpload.size / (1024 * 1024)).toFixed(2) + 'MB',
            reduction: ((1 - fileToUpload.size / file.size) * 100).toFixed(1) + '%',
            underLimit: fileToUpload.size <= MAX_UPLOAD_SIZE
          })
        } catch (compressErr) {
          console.error('Compression/conversion failed:', compressErr)
          
          // For HEIC files, if conversion fails, try to upload original (server Sharp can handle it)
          if (isHeic) {
            console.warn('HEIC conversion failed, attempting to upload original (server will handle)')
            // Server-side Sharp can handle HEIC, so continue with original
            fileToUpload = file
            // But if it's still too large, we have a problem
            if (file.size > MAX_UPLOAD_SIZE) {
              const errorCode = 'UPLOAD-REQUEST-002'
              const errorMessage = `HEIC file is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB) and conversion failed. Please convert to JPEG first or use a smaller image.`
              console.error(errorMessage)
              const error = new Error(errorMessage) as Error & { code?: string }
              error.code = errorCode
              throw error
            }
            // If HEIC is under limit, continue with original (server will handle conversion)
            // Don't return - let it continue to upload
          } else {
          
          // For non-HEIC files, if compression fails and file is still too large, show error
          if (file.size > MAX_UPLOAD_SIZE) {
            const errorCode = 'UPLOAD-REQUEST-002'
            const errorMessage = `Image is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB) and compression failed. Please use a smaller image.`
            console.error(errorMessage)
            // Create error with code property
            const error = new Error(errorMessage) as Error & { code?: string }
            error.code = errorCode
            throw error
          }
            // If file is under limit even without compression, continue
            console.warn('Compression failed but file is under limit, continuing with original')
          }
        }
      } else {
        console.log('No client-side compression needed:', {
          fileSize: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
          fileName: file.name,
          exifOrientation: detectedOrientation,
          note: 'Server-side Sharp will handle EXIF orientation'
        })
      }
      
      // Simple file upload - all processing done server-side with Sharp
      const formData = new FormData()
      formData.append('image', fileToUpload)

      const xhr = new XMLHttpRequest()

      // Upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const uploadProgress = (event.loaded / event.total) * 100
          setProgress(uploadProgress)
          notifyStateChange({ uploading: true, progress: uploadProgress, success: false })
        }
      })

      const uploadPromise = new Promise<{ url: string; filename: string }>((resolve, reject) => {
        // Add timeout (60 seconds)
        const timeout = setTimeout(() => {
          xhr.abort()
          const appError = createError('CLIENT-TIMEOUT-001')
          const error = new Error(appError.message) as Error & { code?: string }
          error.code = appError.code
          reject(error)
        }, 60000)

        xhr.addEventListener('load', () => {
          clearTimeout(timeout)
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText) as { url: string; filename: string }
              resolve(data)
            } catch (err) {
              const appError = createError('CLIENT-PARSE-001', {
                cause: err
              })
              const error = new Error(appError.message) as Error & { code?: string }
              error.code = appError.code
              reject(error)
            }
          } else {
            // Log detailed error information for debugging
            console.error('Upload failed:', {
              status: xhr.status,
              statusText: xhr.statusText,
              responseText: xhr.responseText?.substring(0, 500), // First 500 chars
              responseType: xhr.responseType,
              readyState: xhr.readyState
            })
            
            try {
              const errorData = JSON.parse(xhr.responseText) as { error?: string; code?: string; message?: string }
              // Use server-provided error code if it follows our pattern, otherwise default to CLIENT-REQUEST-001
              const isValidCode = errorData.code && (
                errorData.code.startsWith('AUTH-') ||
                errorData.code.startsWith('UPLOAD-') ||
                errorData.code.startsWith('IMAGE-') ||
                errorData.code.startsWith('STORAGE-') ||
                errorData.code.startsWith('CLIENT-')
              )
              const errorCode = isValidCode ? errorData.code! : 'CLIENT-REQUEST-001'
              const appError = createError(errorCode, {
                message: errorData.message || errorData.error || `Upload failed (${xhr.status})`,
                details: errorData.message || errorData.error
              })
              const error = new Error(appError.message) as Error & { code?: string }
              error.code = appError.code
              reject(error)
            } catch (parseErr) {
              // Response is not JSON - check for specific error patterns
              const responsePreview = xhr.responseText?.substring(0, 500) || 'No response body'
              
              // Detect FUNCTION_PAYLOAD_TOO_LARGE error (413 from platform)
              if (xhr.status === 413 && (
                responsePreview.includes('FUNCTION_PAYLOAD_TOO_LARGE') ||
                responsePreview.includes('Payload Too Large') ||
                responsePreview.includes('Request Entity Too Large')
              )) {
                const appError = createError('UPLOAD-REQUEST-002', {
                  details: `Platform function payload limit exceeded. ${responsePreview}`
                })
                const error = new Error(appError.message) as Error & { code?: string }
                error.code = appError.code
                reject(error)
                return
              }
              
              // Generic error for non-JSON responses
              const appError = createError('CLIENT-REQUEST-001', {
                details: `HTTP ${xhr.status}${xhr.statusText ? `: ${xhr.statusText}` : ''}. ${responsePreview}`
              })
              const error = new Error(appError.message) as Error & { code?: string }
              error.code = appError.code
              reject(error)
            }
          }
        })

        xhr.addEventListener('error', (event) => {
          clearTimeout(timeout)
          // Log network error details for debugging
          console.error('Network error during upload:', {
            readyState: xhr.readyState,
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText?.substring(0, 200),
            event: event
          })
          const appError = createError('CLIENT-NETWORK-001', {
            cause: event
          })
          const error = new Error(appError.message) as Error & { code?: string }
          error.code = appError.code
          reject(error)
        })

        xhr.addEventListener('abort', () => {
          clearTimeout(timeout)
          const appError = createError('CLIENT-TIMEOUT-001', {
            message: 'Upload cancelled or timed out'
          })
          const error = new Error(appError.message) as Error & { code?: string }
          error.code = appError.code
          reject(error)
        })

        xhr.open('POST', '/api/images/upload')
        // Don't set Content-Type - let browser set it with boundary for FormData
        // This is critical for Safari to work properly
        
        // Add timeout handling for mobile browsers
        xhr.timeout = 60000 // 60 seconds (matches the setTimeout)
        
        xhr.addEventListener('timeout', () => {
          clearTimeout(timeout)
          const appError = createError('CLIENT-TIMEOUT-001')
          const error = new Error(appError.message) as Error & { code?: string }
          error.code = appError.code
          reject(error)
        })
        
        xhr.send(formData)
      })

      const { url } = await uploadPromise

      setProgress(100)
      setSuccess(true)
      notifyStateChange({ uploading: false, progress: 100, success: true })
      // No success toast - the tick symbol on the button is sufficient feedback

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Reset button to normal after 1 second
      setTimeout(() => {
        setUploading(false)
        setProgress(0)
        setSuccess(false)
        notifyStateChange({ uploading: false, progress: 0, success: false })
      }, 1000)

      // Redirect to feed after showing success tick and reset (1.5 seconds total)
      setTimeout(() => {
        router.push('/feed')
      }, 1500)
    } catch (err) {
      setUploading(false)
      setProgress(0)
      setSuccess(false)
      notifyStateChange({ uploading: false, progress: 0, success: false })
      
      const errorCode = (err as Error & { code?: string })?.code || 'UNKNOWN'
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image'
      
      // Handle resolution error - redirect to /bruh
      if (errorCode === 'IMAGE-RESOLUTION-001' || errorMessage.includes('Resolution too low')) {
        console.error('Resolution too low, redirecting to /bruh')
        router.push('/bruh')
        return
      }
      
      console.error('Upload error:', errorMessage, `[${errorCode}]`)
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
    </>
  )
})

ImageUploadForm.displayName = 'ImageUploadForm'

export default ImageUploadForm


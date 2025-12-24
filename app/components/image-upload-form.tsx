'use client'

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createError } from '@/app/utils/errors'
import { compressImage, needsCompression } from '@/app/utils/image-compression'

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

  // Auto-dismiss toast after 3 seconds and reset upload state
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
        // Reset upload state to normal after toast disappears
        setUploading(false)
        setProgress(0)
        setSuccess(false)
        notifyStateChange({ uploading: false, progress: 0, success: false })
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [message])

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
      // Compress image if it's too large (to avoid platform payload limits)
      let fileToUpload = file
      if (needsCompression(file)) {
        try {
          setMessage({ 
            type: 'success', 
            text: 'Compressing image...',
          })
          fileToUpload = await compressImage(file)
        } catch (compressErr) {
          console.error('Compression failed:', compressErr)
          // Continue with original file if compression fails
          // Server will handle it or return appropriate error
        }
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
        router.push('/bruh')
        return
      }
      
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


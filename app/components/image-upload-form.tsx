'use client'

import { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { useRouter } from 'next/navigation'

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
      // Simple file upload - all processing done server-side in Python
      const formData = new FormData()
      formData.append('image', file)

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
      
      // Handle resolution error - redirect to /bruh
      if (errorCode === 'UPLOAD_010' || errorMessage.includes('Resolution too low')) {
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


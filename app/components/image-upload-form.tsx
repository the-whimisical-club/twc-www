'use client'

import { useState, useRef, forwardRef, useImperativeHandle } from 'react'

export interface ImageUploadFormHandle {
  triggerFileSelect: () => void
  getUploadState: () => { uploading: boolean; progress: number; success: boolean }
}

const ImageUploadForm = forwardRef<ImageUploadFormHandle, { onStateChange?: (state: { uploading: boolean; progress: number; success: boolean }) => void }>((props, ref) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    setUploading(true)
    setProgress(0)
    setSuccess(false)
    setMessage(null)
    notifyStateChange({ uploading: true, progress: 0, success: false })

    try {
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('image', file)

      const workerUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL || 'https://twc-image-worker.work-caa.workers.dev'

      // Upload to Cloudflare Worker
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          setProgress(percentComplete)
          notifyStateChange({ uploading: true, progress: percentComplete, success: false })
        }
      })

      const uploadPromise = new Promise<{ url: string; filename: string }>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText) as { url: string; filename: string }
              resolve(data)
            } catch (err) {
              reject(new Error('Failed to parse response'))
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText) as { error?: string }
              reject(new Error(errorData.error || 'Upload failed'))
            } catch {
              reject(new Error('Upload failed'))
            }
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'))
        })

        xhr.open('PUT', workerUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      const { url } = await uploadPromise

      // Save URL to database via server action
      const response = await fetch('/api/images/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error('Failed to save image URL')
      }

      setProgress(100)
      setSuccess(true)
      notifyStateChange({ uploading: false, progress: 100, success: true })
      setMessage({ type: 'success', text: 'Image uploaded successfully!' })

      // Reset after 2 seconds
      setTimeout(() => {
        setSuccess(false)
        setProgress(0)
        notifyStateChange({ uploading: false, progress: 0, success: false })
      }, 2000)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setUploading(false)
      setProgress(0)
      setSuccess(false)
      notifyStateChange({ uploading: false, progress: 0, success: false })
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to upload image' 
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
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 p-3 rounded z-50 ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-500'
              : 'bg-red-500/20 text-red-500'
          }`}
        >
          {message.text}
        </div>
      )}
    </>
  )
})

ImageUploadForm.displayName = 'ImageUploadForm'

export default ImageUploadForm


'use client'

import { useState, useRef, forwardRef, useImperativeHandle } from 'react'

export interface ImageUploadFormHandle {
  triggerFileSelect: () => void
  getUploadState: () => { uploading: boolean; progress: number; success: boolean }
}

// Convert image to WebP format
async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to convert image to WebP'))
            }
          },
          'image/webp',
          0.9 // Quality (0-1)
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// Generate filename: dd-mm-yyyy-user-10digitrandom.webp
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
    const charsArray = chars.split('')
    let result = ''
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Use crypto for better randomness
      const array = new Uint32Array(10)
      crypto.getRandomValues(array)
      for (let i = 0; i < array.length; i++) {
        const value = array[i]
        if (value !== undefined) {
          const index = value % charsArray.length
          const char = charsArray[index]
          if (char) result += char
        }
      }
    } else {
      // Fallback to Math.random
      for (let i = 0; i < 10; i++) {
        const index = Math.floor(Math.random() * charsArray.length)
        const char = charsArray[index]
        if (char) result += char
      }
    }
    return result
  }
  
  const randomSequence = generateRandomSequence()
  
  // Return format: dd-mm-yyyy-user-10digitrandom.webp
  return `${dd}-${mm}-${yyyy}-${sanitizedUsername}-${randomSequence}.webp`
}

interface ImageUploadFormProps {
  onStateChange?: (state: { uploading: boolean; progress: number; success: boolean }) => void
  username?: string
}

const ImageUploadForm = forwardRef<ImageUploadFormHandle, ImageUploadFormProps>((props, ref) => {
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

    if (!props.username) {
      setMessage({ type: 'error', text: 'User information not available' })
      return
    }

    setUploading(true)
    setProgress(0)
    setSuccess(false)
    setMessage(null)
    notifyStateChange({ uploading: true, progress: 0, success: false })

    try {
      // Convert to WebP
      setProgress(5)
      notifyStateChange({ uploading: true, progress: 5, success: false })
      const webpBlob = await convertToWebP(file)
      
      // Generate filename
      const filename = generateFilename(file, props.username)
      
      setProgress(10)
      notifyStateChange({ uploading: true, progress: 10, success: false })

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('image', webpBlob, filename)
      formData.append('filename', filename)

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

        xhr.open('POST', '/api/images/upload')
        xhr.send(formData)
      })

      const { url } = await uploadPromise

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


'use client'

import { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { uploadImage } from '@/app/actions/images'

export interface ImageUploadFormHandle {
  triggerFileSelect: () => void
}

const ImageUploadForm = forwardRef<ImageUploadFormHandle>((props, ref) => {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    triggerFileSelect: () => {
      fileInputRef.current?.click()
    },
  }))

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('image', file)
    const result = await uploadImage(formData)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Image uploaded successfully!' })
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    setUploading(false)
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


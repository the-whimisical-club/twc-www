'use client'

import { useState } from 'react'
import { uploadImage } from '@/app/actions/images'

export default function ImageUploadForm() {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await uploadImage(formData)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Image uploaded successfully!' })
      // Reset form
      e.currentTarget.reset()
    }

    setUploading(false)
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="image" className="block text-foreground font-stack-sans-notch mb-2">
            Upload an image
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            required
            disabled={uploading}
            className="w-full text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-foreground file:text-background file:cursor-pointer disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="px-6 py-3 bg-foreground text-background font-stack-sans-notch rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      
      {message && (
        <div
          className={`mt-4 p-3 rounded ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-500'
              : 'bg-red-500/20 text-red-500'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}


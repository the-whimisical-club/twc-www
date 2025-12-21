'use client'

import { useState } from 'react'
import { updateDisplayName } from '@/app/actions/profile'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  username: string
  display_name: string | null
  email: string
}

interface ProfileClientProps {
  initialProfile: Profile
}

export default function ProfileClient({ initialProfile }: ProfileClientProps) {
  const [displayName, setDisplayName] = useState(initialProfile.display_name || initialProfile.username)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (displayName.trim() === (initialProfile.display_name || initialProfile.username)) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateDisplayName(displayName.trim())
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setIsEditing(false)
        // Refresh the page to show updated data
        setTimeout(() => {
          router.refresh()
        }, 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update display name')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(initialProfile.display_name || initialProfile.username)
    setIsEditing(false)
    setError(null)
    setSuccess(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-foreground font-stack-sans-notch text-sm mb-2 block">
            email
          </label>
          <div className="text-foreground font-stack-sans-notch">
            {initialProfile.email}
          </div>
        </div>

        <div>
          <label className="text-foreground font-stack-sans-notch text-sm mb-2 block">
            username
          </label>
          <div className="text-foreground font-stack-sans-notch">
            {initialProfile.username}
          </div>
        </div>

        <div>
          <label className="text-foreground font-stack-sans-notch text-sm mb-2 block">
            display name
          </label>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="w-full px-4 py-2 bg-background border border-foreground/20 rounded text-foreground font-stack-sans-notch focus:outline-none focus:border-foreground"
                placeholder="Enter display name"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving || displayName.trim().length === 0}
                  className="px-4 py-2 bg-foreground text-background font-stack-sans-notch rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'saving...' : 'save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 border border-foreground/20 text-foreground font-stack-sans-notch rounded hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-foreground font-stack-sans-notch">
                {initialProfile.display_name || initialProfile.username}
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="text-foreground/60 font-stack-sans-notch text-sm underline hover:no-underline"
              >
                edit
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-500 p-4 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 text-green-500 p-4 rounded">
          Display name updated successfully!
        </div>
      )}
    </div>
  )
}


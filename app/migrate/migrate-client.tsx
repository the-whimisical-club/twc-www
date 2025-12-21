'use client'

import { useState } from 'react'
import { approveUsers, type PendingUser } from '@/app/actions/migrate'
import { useRouter } from 'next/navigation'

interface MigrateClientProps {
  initialUsers: PendingUser[]
}

export default function MigrateClient({ initialUsers }: MigrateClientProps) {
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleToggle = (email: string) => {
    const newSelected = new Set(selectedEmails)
    if (newSelected.has(email)) {
      newSelected.delete(email)
    } else {
      newSelected.add(email)
    }
    setSelectedEmails(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedEmails.size === initialUsers.length) {
      setSelectedEmails(new Set())
    } else {
      setSelectedEmails(new Set(initialUsers.map(u => u.email)))
    }
  }

  const handleSubmit = async () => {
    if (selectedEmails.size === 0) {
      setError('Please select at least one user to approve')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await approveUsers(Array.from(selectedEmails))
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        // Refresh the page after a short delay to show updated list
        setTimeout(() => {
          router.refresh()
        }, 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve users')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-foreground font-stack-sans-notch">
          {selectedEmails.size} of {initialUsers.length} selected
        </div>
        <button
          onClick={handleSelectAll}
          className="text-foreground font-stack-sans-notch underline hover:no-underline"
        >
          {selectedEmails.size === initialUsers.length ? 'deselect all' : 'select all'}
        </button>
      </div>

      <div className="space-y-2">
        {initialUsers.map((user) => (
          <label
            key={user.email}
            className="flex items-center gap-4 p-4 border border-foreground/20 rounded hover:bg-foreground/5 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedEmails.has(user.email)}
              onChange={() => handleToggle(user.email)}
              className="w-5 h-5"
            />
            <div className="flex-1">
              <div className="text-foreground font-stack-sans-notch">
                {user.email}
              </div>
            </div>
          </label>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-500 p-4 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 text-green-500 p-4 rounded">
          Users approved successfully! Refreshing...
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || selectedEmails.size === 0}
        className="px-6 py-3 bg-foreground text-background font-stack-sans-notch rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'approving...' : 'confirm'}
      </button>
    </div>
  )
}


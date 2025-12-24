'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createThought } from '@/app/actions/thoughts'

type Thought = {
  id: string
  content: string
  created_at: string
  user_id: string
  users: {
    username: string
    display_name: string | null
  } | null
}

export default function ThoughtsClient({ initialThoughts }: { initialThoughts: Thought[] }) {
  const [thoughts, setThoughts] = useState<Thought[]>(initialThoughts)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Sync thoughts when initialThoughts changes (after refresh)
  useEffect(() => {
    setThoughts(initialThoughts)
  }, [initialThoughts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError('Please enter some text')
      return
    }

    if (content.length > 10000) {
      setError('Text is too long (max 10000 characters)')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await createThought(content)
      
      if (result.error) {
        setError(result.error)
        setSubmitting(false)
        return
      }

      // Add new thought to the top of the list
      if (result.thought) {
        // We need to fetch the full thought with user info, but for now we'll refresh
        router.refresh()
        setContent('')
        setSubmitting(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create thought')
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Form to add new thought */}
      <form onSubmit={handleSubmit} className="mb-12 md:mb-20">
        <div className="flex flex-col gap-4">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              setError(null)
            }}
            placeholder="What's on your mind?"
            className="w-full min-h-[200px] p-4 bg-background border border-foreground/20 text-foreground font-stack-sans-notch text-lg rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-foreground-50"
            disabled={submitting}
            maxLength={10000}
          />
          <div className="flex items-center justify-between">
            <div className="text-foreground-50 font-stack-sans-notch text-sm">
              {content.length}/10000
            </div>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-6 py-2 bg-foreground text-background font-stack-sans-notch rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
          {error && (
            <div className="text-red-500 font-stack-sans-notch text-sm">
              {error}
            </div>
          )}
        </div>
      </form>

      {/* List of thoughts */}
      {thoughts.length === 0 ? (
        <div className="text-foreground font-stack-sans-notch text-2xl text-center">
          no thoughts yet. share one now!
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {thoughts.map((thought) => {
            const user = thought.users
            const userName = user ? (user.display_name || user.username) : 'unknown'
            return (
              <div
                key={thought.id}
                className="p-6 bg-background border border-foreground/20 rounded-lg"
              >
                <div className="text-foreground font-stack-sans-notch text-lg whitespace-pre-wrap break-words mb-4">
                  {thought.content}
                </div>
                <div className="text-foreground-50 font-stack-sans-notch text-sm">
                  {userName}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


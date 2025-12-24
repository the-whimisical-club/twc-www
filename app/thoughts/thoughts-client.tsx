'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, CornerDownLeft } from 'lucide-react'
import { createThought, deleteThought } from '@/app/actions/thoughts'

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

export default function ThoughtsClient({ 
  initialThoughts, 
  currentUserId 
}: { 
  initialThoughts: Thought[]
  currentUserId: string | null
}) {
  const [thoughts, setThoughts] = useState<Thought[]>(initialThoughts)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  // Sync thoughts when initialThoughts changes (after refresh)
  useEffect(() => {
    setThoughts(initialThoughts)
  }, [initialThoughts])

  const submitThought = async () => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (content.trim() && !submitting) {
        submitThought()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    submitThought()
  }

  const handleDelete = async (thoughtId: string) => {
    setDeletingId(thoughtId)
    setError(null)

    try {
      const result = await deleteThought(thoughtId)
      
      if (result.error) {
        setError(result.error)
        setDeletingId(null)
        return
      }

      // Remove the thought from the UI
      setThoughts(prevThoughts => prevThoughts.filter(t => t.id !== thoughtId))
      setDeletingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete thought')
      setDeletingId(null)
    }
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Form to add new thought */}
      <form onSubmit={handleSubmit} className="mb-12 md:mb-20">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setError(null)
              }}
              onKeyDown={handleKeyDown}
              className="w-full min-h-[200px] p-4 bg-background border border-foreground/20 text-foreground font-stack-sans-notch text-lg rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-foreground-50"
              disabled={submitting}
              maxLength={10000}
            />
            {!content && (
              <div className="absolute top-4 left-4 pointer-events-none text-foreground-50 font-stack-sans-notch text-lg flex items-center gap-1.5 flex-wrap">
                <span>hit</span>
                <span className="flex items-center gap-1">
                  return
                  <CornerDownLeft size={16} className="inline" />
                </span>
                <span>to send, use shift +</span>
                <span className="flex items-center gap-1">
                  return
                  <CornerDownLeft size={16} className="inline" />
                </span>
                <span>for multi-line</span>
              </div>
            )}
          </div>
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
            const isOwner = currentUserId && thought.user_id === currentUserId
            return (
              <div
                key={thought.id}
                className="p-6 bg-background border border-foreground/20 rounded-lg relative"
              >
                {isOwner && (
                  <button
                    onClick={() => handleDelete(thought.id)}
                    disabled={deletingId === thought.id}
                    className="absolute top-4 right-4 text-foreground-50 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1"
                    aria-label="Delete thought"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <div className="text-foreground font-stack-sans-notch text-lg whitespace-pre-wrap wrap-break-word mb-4">
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


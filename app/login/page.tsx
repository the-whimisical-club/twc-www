'use client'

import { useState } from 'react'
import { sendOTP } from '../actions/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('email', email)

    const result = await sendOTP(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      // Store email in sessionStorage for the verify page
      sessionStorage.setItem('otp_email', email)
      router.push('/verify')
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8">
        <h1 className="text-4xl font-dashing mb-8 text-center">Log In</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-foreground rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-foreground text-background rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          We'll send you an 8-digit code to verify your email.
        </p>

        <div className="mt-4 text-center">
          <a
            href="/signup"
            className="text-sm text-gray-600 hover:text-foreground underline"
          >
            Don't have an account? Sign up
          </a>
        </div>
      </div>
    </div>
  )
}


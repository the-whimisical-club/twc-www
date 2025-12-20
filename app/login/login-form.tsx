'use client'

import { useState } from 'react'
import { sendOTP } from '../actions/auth'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
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
        <h1 className="text-4xl font-dark-london mb-8 text-center text-foreground">LOG IN</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
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
            className="w-full px-4 py-2 bg-foreground text-background rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-background"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-foreground-50">
          We'll send you an 8-digit code to verify your email.
        </p>

        <div className="mt-4 text-center">
          <a
            href="/signup"
            className="text-sm text-foreground-50 hover:text-foreground underline"
          >
            Don't have an account? Sign up
          </a>
        </div>
      </div>
    </div>
  )
}


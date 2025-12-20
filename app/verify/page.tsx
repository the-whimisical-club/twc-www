'use client'

import { useState, useEffect } from 'react'
import { verifyOTP } from '../actions/auth'
import { useRouter } from 'next/navigation'

export default function VerifyPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get email from sessionStorage
    const storedEmail = sessionStorage.getItem('otp_email')
    if (storedEmail) {
      setEmail(storedEmail)
    } else {
      // If no email found, redirect to signup
      router.push('/signup')
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('code', code)

    const result = await verifyOTP(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
    // If successful, verifyOTP will redirect, so we don't need to handle success here
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
    setCode(value)
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8">
        <h1 className="text-4xl font-dark-london mb-2 text-center text-foreground">VERIFY EMAIL</h1>
        <p className="text-center text-sm text-foreground-50 mb-8">
          Enter the 8-digit code sent to {email}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-2 text-foreground">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={handleCodeChange}
              required
              maxLength={8}
              className="w-full px-4 py-2 border border-foreground rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground text-center text-2xl tracking-widest font-mono"
              placeholder="00000000"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 8}
            className="w-full px-4 py-2 bg-foreground text-background rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              sessionStorage.removeItem('otp_email')
              router.push('/signup')
            }}
            className="text-sm text-foreground-50 hover:text-foreground underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    </div>
  )
}


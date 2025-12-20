'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function sendOTP(formData: FormData) {
  try {
    const email = formData.get('email') as string

    if (!email) {
      return { error: 'Email is required' }
    }

    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    // Note: For OTP codes to be sent instead of magic links, you must modify
    // the Magic Link email template in Supabase Dashboard:
    // Authentication > Email Templates > Magic Link
    // Replace the template content to include {{ .Token }} variable:
    // <h2>One time login code</h2>
    // <p>Please enter this code: {{ .Token }}</p>
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // Don't set emailRedirectTo to ensure OTP mode (not magic link)
      },
    })

    if (error) {
      console.error('Supabase OTP error:', error)
      return { error: error.message }
    }

    return { success: true, email }
  } catch (err) {
    console.error('sendOTP error:', err)
    return { 
      error: err instanceof Error 
        ? err.message 
        : 'Failed to send verification code. Please check your connection and try again.' 
    }
  }
}

export async function verifyOTP(formData: FormData) {
  const email = formData.get('email') as string
  const token = formData.get('code') as string

  if (!email || !token) {
    return { error: 'Email and code are required' }
  }

  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const { error, data } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    return { error: error.message }
  }

  if (data.session) {
    // Insert email into waiting_approval table
    // Try to insert, but don't fail if email already exists
    const { error: insertError } = await supabase
      .from('waiting_approval')
      .insert({ email })

    // If error is due to duplicate, that's okay - email is already in the table
    // For other errors, log but don't block the user from logging in
    if (insertError && insertError.code !== '23505') {
      // 23505 is PostgreSQL unique violation error code
      console.error('Error adding email to waiting_approval:', insertError)
    }

    redirect('/home')
  }

  return { error: 'Verification failed' }
}

export async function signOut() {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)
  await supabase.auth.signOut()
  redirect('/signup')
}


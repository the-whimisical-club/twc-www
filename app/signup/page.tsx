import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SignupForm from './signup-form'

export default async function SignupPage() {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    // Check if user is already authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Redirect to home if already logged in
    if (user) {
      redirect('/home')
    }

    return <SignupForm />
  } catch (error) {
    console.error('Signup page error:', error)
    // Still render the form even if there's an error checking auth
    // This allows users to still sign up even if there's a temporary issue
    return <SignupForm />
  }
}

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SignupForm from './signup-form'

export default async function SignupPage() {
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
}

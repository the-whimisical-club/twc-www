import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LoginForm from './login-form'

export default async function LoginPage() {
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

  return <LoginForm />
}

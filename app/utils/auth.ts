import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isUserApproved } from './users'

export async function requireAuth() {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/signup')
  }

  // Check if user is approved (exists in users table)
  const approved = await isUserApproved(user.id)
  
  if (!approved) {
    redirect('/waitlist')
  }
  
  return { user, supabase }
}

/**
 * Check if current user is admin (siddivishruth@gmail.com)
 */
export async function requireAdmin() {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.email !== 'siddivishruth@gmail.com') {
    redirect('/signup')
  }
  
  return { user, supabase }
}


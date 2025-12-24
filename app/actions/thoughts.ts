'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { ensureUser } from '@/app/utils/users'

export async function getThoughts() {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from('thoughts')
      .select('id, content, created_at, user_id, users(username, display_name)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return { error: 'Failed to fetch thoughts' }
    }

    return { success: true, thoughts: data || [] }
  } catch (err) {
    console.error('Fetch error:', err)
    return { 
      error: err instanceof Error 
        ? err.message 
        : 'Failed to fetch thoughts' 
    }
  }
}

export async function createThought(content: string) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return { error: 'Not authenticated' }
    }

    // Check if user is approved
    const { isUserApproved } = await import('@/app/utils/users')
    const approved = await isUserApproved(user.id)
    if (!approved) {
      return { error: 'User not approved' }
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      return { error: 'Content cannot be empty' }
    }

    if (content.length > 10000) {
      return { error: 'Content is too long (max 10000 characters)' }
    }

    // Ensure user exists in users table and get their id
    const userRecord = await ensureUser(user.id, user.email)
    
    if (!userRecord) {
      return { error: 'Failed to get user record' }
    }

    // Insert thought
    const { data, error } = await supabase
      .from('thoughts')
      .insert({ content: content.trim(), user_id: userRecord.id })
      .select('id, content, created_at')
      .single()

    if (error) {
      console.error('Database error:', error)
      return { error: 'Failed to create thought' }
    }

    return { success: true, thought: data }
  } catch (err) {
    console.error('Create thought error:', err)
    return { 
      error: err instanceof Error 
        ? err.message 
        : 'Failed to create thought' 
    }
  }
}


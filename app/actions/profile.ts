'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/app/utils/auth'

/**
 * Get current user's profile
 */
export async function getUserProfile() {
  try {
    const { user } = await requireAuth()
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, email')
      .eq('auth_user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return { error: 'Failed to fetch profile' }
    }

    return { success: true, profile: data }
  } catch (err) {
    console.error('Error in getUserProfile:', err)
    return { 
      error: err instanceof Error ? err.message : 'Failed to fetch profile' 
    }
  }
}

/**
 * Update user's display name
 */
export async function updateDisplayName(displayName: string) {
  try {
    if (!displayName || displayName.trim().length === 0) {
      return { error: 'Display name cannot be empty' }
    }

    if (displayName.length > 50) {
      return { error: 'Display name must be 50 characters or less' }
    }

    const { user } = await requireAuth()
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from('users')
      .update({ display_name: displayName.trim() })
      .eq('auth_user_id', user.id)
      .select('id, username, display_name, email')
      .single()

    if (error) {
      console.error('Error updating display name:', error)
      return { error: 'Failed to update display name' }
    }

    return { success: true, profile: data }
  } catch (err) {
    console.error('Error in updateDisplayName:', err)
    return { 
      error: err instanceof Error ? err.message : 'Failed to update display name' 
    }
  }
}


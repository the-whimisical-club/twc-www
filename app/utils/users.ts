'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

/**
 * Checks if a user exists in the users table
 */
export async function isUserApproved(authUserId: string): Promise<boolean> {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single()

    if (error || !data) {
      return false
    }

    return true
  } catch (err) {
    console.error('Error checking user approval:', err)
    return false
  }
}

/**
 * Ensures a user exists in the users table
 * Creates the user if they don't exist, updates email/username if they do
 * Returns the user's id from the users table
 */
export async function ensureUser(authUserId: string, email: string): Promise<{ id: string; username: string } | null> {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    // Extract username from email (part before @)
    const username = email.split('@')[0] || email

    // Try to get existing user
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id, username')
      .eq('auth_user_id', authUserId)
      .single()

    if (existingUser) {
      // User exists, update email if it changed
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ email, username })
        .eq('id', existingUser.id)
        .select('id, username')
        .single()

      if (updateError) {
        console.error('Error updating user:', updateError)
        return existingUser
      }

      return updatedUser || existingUser
    }

    // User doesn't exist, create them
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authUserId,
        email,
        username,
      })
      .select('id, username')
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      return null
    }

    return newUser
  } catch (err) {
    console.error('Error in ensureUser:', err)
    return null
  }
}


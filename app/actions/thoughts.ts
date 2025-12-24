'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { ensureUser } from '@/app/utils/users'

export async function getThoughts() {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    // Deleted thoughts are moved to deleted_thoughts table, so we just fetch all from thoughts
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

export async function deleteThought(thoughtId: string) {
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

    // Ensure user exists in users table and get their id
    const userRecord = await ensureUser(user.id, user.email)
    
    if (!userRecord) {
      return { error: 'Failed to get user record' }
    }

    // First, verify the thought exists and belongs to the user, and get full thought data
    const { data: thought, error: fetchError } = await supabase
      .from('thoughts')
      .select('id, content, created_at, user_id')
      .eq('id', thoughtId)
      .single()

    if (fetchError || !thought) {
      return { error: 'Thought not found' }
    }

    if (thought.user_id !== userRecord.id) {
      return { error: 'Not authorized to delete this thought' }
    }

    // Move thought to deleted_thoughts table
    const { error: moveError } = await supabase
      .from('deleted_thoughts')
      .insert({
        id: thought.id,
        content: thought.content,
        created_at: thought.created_at,
        user_id: thought.user_id,
        deleted_at: new Date().toISOString()
      })

    if (moveError) {
      console.error('Database error moving to deleted_thoughts:', moveError)
      // If deleted_thoughts table doesn't exist, return helpful error
      if (moveError.message?.includes('relation') || moveError.message?.includes('does not exist')) {
        return { error: 'Database migration required: Please create the deleted_thoughts table. See README.md for instructions.' }
      }
      return { error: 'Failed to delete thought' }
    }

    // Delete from thoughts table
    const { error: deleteError } = await supabase
      .from('thoughts')
      .delete()
      .eq('id', thoughtId)

    if (deleteError) {
      console.error('Database error deleting from thoughts:', deleteError)
      return { error: 'Failed to delete thought' }
    }

    return { success: true }
  } catch (err) {
    console.error('Delete thought error:', err)
    return { 
      error: err instanceof Error 
        ? err.message 
        : 'Failed to delete thought' 
    }
  }
}


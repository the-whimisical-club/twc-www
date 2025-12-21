'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export interface PendingUser {
  email: string
  auth_user_id: string | null
}

/**
 * Get service role client for admin operations
 */
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'Get it from Supabase Dashboard → Settings → API → Service Role Key. ' +
      'Add it to your .env file.'
    )
  }

  return createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Get all users from waiting_approval who are not yet in users table
 */
export async function getPendingUsers(): Promise<{ users: PendingUser[]; error?: string }> {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    const serviceClient = getServiceClient()

    // Get all emails from waiting_approval
    const { data: waitingUsers, error: waitingError } = await supabase
      .from('waiting_approval')
      .select('email')

    if (waitingError) {
      console.error('Error fetching waiting_approval:', waitingError)
      return { users: [], error: 'Failed to fetch pending users' }
    }

    if (!waitingUsers || waitingUsers.length === 0) {
      return { users: [] }
    }

    // Get all emails that are already in users table
    const { data: approvedUsers, error: approvedError } = await supabase
      .from('users')
      .select('email')

    if (approvedError) {
      console.error('Error fetching users:', approvedError)
      return { users: [], error: 'Failed to fetch approved users' }
    }

    const approvedEmails = new Set(approvedUsers?.map(u => u.email) || [])

    // Filter out emails that are already approved
    const pendingEmails = waitingUsers
      .map(w => w.email)
      .filter(email => !approvedEmails.has(email))

    // Get auth users for pending emails
    const { data: authUsersData, error: authError } = await serviceClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return { users: [], error: 'Failed to fetch auth users' }
    }

    // Map emails to auth user IDs and filter out users without auth accounts
    const pendingUsers: PendingUser[] = []
    const emailsToRemove: string[] = []

    for (const email of pendingEmails) {
      const authUser = authUsersData?.users.find(u => u.email === email)
      if (authUser) {
        pendingUsers.push({
          email,
          auth_user_id: authUser.id,
        })
      } else {
        // Mark for removal - no auth user found
        emailsToRemove.push(email)
      }
    }

    // Automatically remove users without auth accounts from waiting_approval
    if (emailsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('waiting_approval')
        .delete()
        .in('email', emailsToRemove)

      if (deleteError) {
        console.error('Error removing users without auth accounts:', deleteError)
        // Continue anyway - we'll still return the valid users
      } else {
        console.log(`Automatically removed ${emailsToRemove.length} user(s) without auth accounts from waiting_approval`)
      }
    }

    return { users: pendingUsers }
  } catch (err) {
    console.error('Error in getPendingUsers:', err)
    return { 
      users: [], 
      error: err instanceof Error ? err.message : 'Failed to fetch pending users' 
    }
  }
}

/**
 * Approve users by adding them to users table
 */
export async function approveUsers(emails: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    const serviceClient = getServiceClient()

    // Get auth users for these emails
    const { data: authUsersData, error: authError } = await serviceClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return { success: false, error: 'Failed to fetch auth users' }
    }
    
    const usersToInsert: Array<{
      auth_user_id: string
      email: string
      username: string
    }> = []

    for (const email of emails) {
      const authUser = authUsersData?.users.find(u => u.email === email)
      if (authUser) {
        const username = email.split('@')[0] || email
        usersToInsert.push({
          auth_user_id: authUser.id,
          email,
          username,
        })
      }
    }

    if (usersToInsert.length === 0) {
      return { success: false, error: 'No valid users found to approve' }
    }

    // Insert users into users table
    const { error: insertError } = await supabase
      .from('users')
      .insert(usersToInsert)

    if (insertError) {
      console.error('Error inserting users:', insertError)
      return { success: false, error: 'Failed to approve users' }
    }

    return { success: true }
  } catch (err) {
    console.error('Error in approveUsers:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to approve users' 
    }
  }
}


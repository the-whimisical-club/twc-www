'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getLibraryItems() {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from('library')
      .select('id, tmdb_id, title, poster_url, type, year, created_at, user_id, users(username, display_name)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return { error: 'Failed to fetch library items' }
    }

    return { success: true, items: data || [] }
  } catch (err) {
    console.error('Fetch error:', err)
    return { 
      error: err instanceof Error 
        ? err.message 
        : 'Failed to fetch library items' 
    }
  }
}


'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getImages() {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from('images')
      .select('id, url, created_at, user_id, users(username)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return { error: 'Failed to fetch images' }
    }

    return { success: true, images: data || [] }
  } catch (err) {
    console.error('Fetch error:', err)
    return { 
      error: err instanceof Error 
        ? err.message 
        : 'Failed to fetch images' 
    }
  }
}


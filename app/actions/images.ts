'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL

if (!WORKER_URL) {
  throw new Error('Missing CLOUDFLARE_WORKER_URL environment variable')
}

// TypeScript assertion: WORKER_URL is guaranteed to be defined after the check above
const WORKER_URL_SAFE: string = WORKER_URL

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get('image') as File
    
    if (!file) {
      return { error: 'No file provided' }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { error: 'File must be an image' }
    }

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Upload to Cloudflare Worker
    const response = await fetch(WORKER_URL_SAFE, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: arrayBuffer,
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({ error: 'Upload failed' }))) as { error?: string }
      return { error: errorData.error || 'Failed to upload image' }
    }

    const data = (await response.json()) as { url: string; filename: string }
    const { url, filename } = data

    // Save URL to database
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    const { error: dbError } = await supabase
      .from('images')
      .insert({ url })

    if (dbError) {
      console.error('Database error:', dbError)
      return { error: 'Failed to save image URL to database' }
    }

    return { success: true, url, filename }
  } catch (err) {
    console.error('Upload error:', err)
    return { 
      error: err instanceof Error 
        ? err.message 
        : 'Failed to upload image' 
    }
  }
}

export async function getImages() {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from('images')
      .select('id, url, created_at')
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


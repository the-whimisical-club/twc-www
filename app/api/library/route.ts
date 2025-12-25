import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/app/utils/auth'
import { createErrorResponse } from '@/app/utils/errors'

interface LibraryItemRequest {
  id: number | string
  title: string
  poster_url?: string | null
  type: 'movie' | 'tv'
  year?: string | null
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireAuth()

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      const errorResponse = createErrorResponse('AUTH-USER-001')
      return NextResponse.json(errorResponse, { status: errorResponse.httpStatus || 403 })
    }

    // Parse request body
    const body = await request.json() as LibraryItemRequest
    const { id, title, poster_url, type, year } = body

    // Validate required fields
    if (!id || !title || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: id, title, and type are required' },
        { status: 400 }
      )
    }

    // Validate type
    if (type !== 'movie' && type !== 'tv') {
      return NextResponse.json(
        { error: 'Type must be either "movie" or "tv"' },
        { status: 400 }
      )
    }

    // Convert ID to string for database (supports both TMDb numeric IDs and OMDB string IDs)
    const media_id = typeof id === 'string' ? id : String(id)

    // Insert library item
    const { data, error } = await supabase
      .from('library')
      .insert({
        tmdb_id: media_id,
        title,
        poster_url: poster_url || null,
        type,
        year: year || null,
        user_id: userData.id,
      })
      .select()
      .single()

    if (error) {
      // Check if it's a duplicate entry
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This item is already in your library' },
          { status: 409 }
        )
      }

      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to add item to library' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Item added to library successfully', data },
      { status: 201 }
    )
  } catch (err) {
    console.error('Error in POST /api/library:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


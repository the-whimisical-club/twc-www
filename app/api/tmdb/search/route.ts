import { NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

if (!TMDB_API_KEY) {
  console.warn('TMDB_API_KEY environment variable is not set')
}

interface TMDbSearchResult {
  id: number
  media_type: 'movie' | 'tv' | 'person'
  title?: string
  name?: string
  poster_path?: string | null
  release_date?: string
  first_air_date?: string
}

interface TMDbSearchResponse {
  results: TMDbSearchResult[]
}

export async function GET(request: Request) {
  try {
    if (!TMDB_API_KEY) {
      return NextResponse.json(
        { error: 'TMDb API key not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Call TMDb multi-search endpoint
    const response = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query.trim())}&page=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('TMDb API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to search TMDb' },
        { status: response.status }
      )
    }

    const data = await response.json() as TMDbSearchResponse

    // Filter to only movies and TV shows, take top 5
    const results = (data.results || [])
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 5)
      .map((item) => {
        const isMovie = item.media_type === 'movie'
        const posterPath = item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null

        return {
          id: item.id,
          title: isMovie ? item.title : item.name,
          poster_url: posterPath,
          type: isMovie ? 'movie' : 'tv',
          year: isMovie
            ? item.release_date?.substring(0, 4) || null
            : item.first_air_date?.substring(0, 4) || null,
        }
      })

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Error in GET /api/tmdb/search:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'

const OMDB_API_KEY = process.env.OMDB_API_KEY
const OMDB_BASE_URL = 'https://www.omdbapi.com'

if (!OMDB_API_KEY) {
  console.warn('OMDB_API_KEY environment variable is not set')
}

interface OMDBSearchResult {
  Title: string
  Year: string
  imdbID: string
  Type: string
  Poster: string
}

interface OMDBSearchResponse {
  Search?: OMDBSearchResult[]
  totalResults?: string
  Response: string
  Error?: string
}

export async function GET(request: Request) {
  try {
    if (!OMDB_API_KEY) {
      console.error('OMDB_API_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'OMDB API key not configured' },
        { status: 500 }
      )
    }

    // Log API key length for debugging (first 4 chars only for security)
    console.log(`OMDB API key length: ${OMDB_API_KEY.length}, starts with: ${OMDB_API_KEY.substring(0, 4)}...`)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Call OMDB search endpoint
    // OMDB doesn't support comma-separated types, so we search without type to get both movies and series
    // We'll filter the results to only include movies and series
    const response = await fetch(
      `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query.trim())}&page=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OMDB API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to search OMDB' },
        { status: response.status }
      )
    }

    const data = await response.json() as OMDBSearchResponse

    // OMDB returns 200 even for errors, check Response field
    if (data.Response === 'False') {
      const errorMessage = data.Error || 'OMDB API error'
      console.error('OMDB API error:', errorMessage)
      
      // If it's an API key error, return a more helpful message
      if (errorMessage.includes('API key') || errorMessage.includes('Invalid')) {
        return NextResponse.json(
          { error: 'OMDB API key is invalid. Please check your OMDB_API_KEY environment variable.' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    if (!data.Search || data.Search.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Filter to only movies and series, then map to our format, take top 5
    const results = data.Search
      .filter((item) => item.Type === 'movie' || item.Type === 'series')
      .slice(0, 5)
      .map((item) => {
        const isMovie = item.Type === 'movie'
        const posterPath = item.Poster && item.Poster !== 'N/A' ? item.Poster : null

        return {
          id: item.imdbID,
          title: item.Title,
          poster_url: posterPath,
          type: isMovie ? 'movie' : 'tv',
          year: item.Year ? item.Year.substring(0, 4) : null,
          source: 'omdb' as const,
        }
      })

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Error in GET /api/omdb/search:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


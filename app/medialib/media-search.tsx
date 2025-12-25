'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'

interface MediaResult {
  id: number | string
  title: string
  poster_url: string | null
  type: 'movie' | 'tv'
  year: string | null
  source?: 'tmdb' | 'omdb'
}

export default function MediaSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MediaResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [addingIds, setAddingIds] = useState<Set<number | string>>(new Set())
  const [searchSource, setSearchSource] = useState<'tmdb' | 'omdb'>('tmdb')

  const handleSearch = async (source: 'tmdb' | 'omdb' = 'tmdb') => {
    if (query.trim().length < 2) {
      setError('Please enter at least 2 characters')
      setResults([])
      setSearchSource('tmdb') // Reset to TMDb
      return
    }

    setLoading(true)
    setError(null)
    setResults([])
    setSearchSource(source)

    try {
      const apiEndpoint = source === 'tmdb' ? '/api/tmdb/search' : '/api/omdb/search'
      const response = await fetch(`${apiEndpoint}?q=${encodeURIComponent(query.trim())}`)
      const data = await response.json() as { results?: MediaResult[]; error?: string }

      if (!response.ok) {
        setError(data.error || 'Search failed')
        return
      }

      setResults(data.results || [])
      if (data.results?.length === 0) {
        setError('No results found')
      }
    } catch (err) {
      setError('Failed to search. Please try again.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNoneOfThese = () => {
    handleSearch('omdb')
  }

  const handleAddToLibrary = async (item: MediaResult) => {
    setAddingIds(prev => new Set(prev).add(item.id))

    try {
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: item.id,
          title: item.title,
          poster_url: item.poster_url,
          type: item.type,
          year: item.year,
        }),
      })

      const data = await response.json() as { success?: boolean; message?: string; error?: string }

      if (!response.ok) {
        setToast({
          message: data.error || 'Failed to add item',
          type: 'error',
        })
        return
      }

      setToast({
        message: 'Added to library successfully!',
        type: 'success',
      })
      
      // Refresh the page to show the new item
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      setToast({
        message: 'Failed to add item. Please try again.',
        type: 'error',
      })
      console.error('Add to library error:', err)
    } finally {
      setAddingIds(prev => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  return (
    <>
      <div className="mb-8 w-full max-w-2xl">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
            placeholder="Search for movies or TV shows..."
            className="flex-1 px-4 py-3 bg-background border border-foreground-50 rounded-md text-foreground placeholder:text-foreground-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => handleSearch('tmdb')}
            disabled={loading}
            className="px-6 py-2 bg-foreground text-background font-stack-sans-notch rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-md w-full max-w-2xl">
          {error}
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-foreground-50" />
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-4 mb-12 w-full max-w-2xl">
          {results.map((item) => (
            <div
              key={item.id}
              className="bg-background border border-foreground-50 rounded-lg p-4 hover:border-foreground transition-colors flex flex-col md:flex-row gap-4 items-center"
            >
              {/* Poster */}
              <div className="shrink-0">
                {item.poster_url ? (
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    className="w-20 h-[120px] object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="92" height="138"%3E%3Crect width="92" height="138" fill="%23333"/%3E%3C/svg%3E'
                    }}
                  />
                ) : (
                  <div className="w-20 h-[120px] bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-foreground-50 text-xs">No Poster</span>
                  </div>
                )}
              </div>

              {/* Title, Year, Type */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-foreground mb-1 truncate">
                  {item.title}
                </h3>
                <div className="text-foreground-50 text-sm">
                  {item.year && <span>{item.year}</span>}
                  {item.year && ' • '}
                  <span className="uppercase">{item.type}</span>
                </div>
              </div>

              {/* Add Button */}
              <div className="shrink-0">
                <button
                  onClick={() => handleAddToLibrary(item)}
                  disabled={addingIds.has(item.id)}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
                >
                  {addingIds.has(item.id) ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    'Add to Library'
                  )}
                </button>
              </div>
            </div>
          ))}
          
          {/* "None of these" button - only show for TMDb results */}
          {searchSource === 'tmdb' && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleNoneOfThese}
                disabled={loading}
                className="px-6 py-2 bg-foreground text-background font-stack-sans-notch rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                None of these
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && !error && query.length >= 2 && (
        <div className="text-center py-12 text-foreground-50 mb-12">
          <p>No results found. Try a different search term.</p>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-4 rounded-md shadow-lg z-50 ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  )
}


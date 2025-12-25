'use client'

interface LibraryItemProps {
  item: {
    id: string
    title: string
    poster_url: string | null
    type: string
    year: string | null
    users: { username: string; display_name: string | null } | null
  }
}

export default function LibraryItem({ item }: LibraryItemProps) {
  const userName = item.users ? (item.users.display_name || item.users.username) : 'unknown'

  return (
    <div className="flex flex-col">
      <div className="aspect-2/3 overflow-hidden rounded w-full bg-gray-800">
        {item.poster_url ? (
          <img
            src={item.poster_url}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450"%3E%3Crect width="300" height="450" fill="%23333"/%3E%3C/svg%3E'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-foreground-50 text-sm">No Poster</span>
          </div>
        )}
      </div>
      <div className="text-foreground font-stack-sans-notch text-sm mt-2">
        {item.title}
      </div>
      <div className="text-foreground-50 font-stack-sans-notch text-xs">
        {item.year && <span>{item.year}</span>}
        {item.year && ' • '}
        <span className="uppercase">{item.type}</span>
        {userName && ` • ${userName}`}
      </div>
    </div>
  )
}


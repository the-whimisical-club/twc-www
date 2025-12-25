import { requireAuth } from '@/app/utils/auth'
import { getLibraryItems } from '@/app/actions/library'
import Navbar from '@/app/components/navbar'
import MediaSearch from './media-search'
import LibraryItem from './library-item'

export default async function MediaLibPage() {
  const { user } = await requireAuth()

  // Fetch library items
  const result = await getLibraryItems()
  const items = result.items || []

  // Normalize items - Supabase returns users as array, but we need it as object or null
  const normalizedItems = items.map((item: any) => ({
    ...item,
    users: Array.isArray(item.users) 
      ? item.users[0] 
      : (item.users as { username: string; display_name: string | null } | null)
  }))

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="flex flex-col items-center px-8 py-16 md:p-20 md:py-40">
        <div className="text-4xl md:text-8xl text-foreground font-dark-london mb-12 md:mb-20">
          medialib
        </div>

        {/* Search Component */}
        <MediaSearch />

        {/* Library Items Grid */}
        {normalizedItems.length === 0 ? (
          <div className="text-foreground font-stack-sans-notch text-2xl">
            no items yet. search and add one now!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {normalizedItems.map((item: any) => (
              <LibraryItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

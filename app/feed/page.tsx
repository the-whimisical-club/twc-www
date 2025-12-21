import { requireAuth } from '@/app/utils/auth'
import { getImages } from '@/app/actions/images'
import NavButtons from '@/app/components/nav-buttons'

export default async function FeedPage() {
  const { user } = await requireAuth()

  // Fetch images
  const result = await getImages()
  const images = result.images || []

  return (
    <div className="bg-background min-h-screen p-8">
      <NavButtons username={user.email || 'user'} />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl text-foreground font-stack-sans-notch mb-8">
          feed
        </h1>
        
        {images.length === 0 ? (
          <div className="text-foreground font-stack-sans-notch text-2xl">
            No images yet. Upload one from the home page!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.id} className="aspect-square overflow-hidden rounded">
                <img
                  src={image.url}
                  alt={`Uploaded image ${image.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


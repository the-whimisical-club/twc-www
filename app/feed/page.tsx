import { requireAuth } from '@/app/utils/auth'
import { getImages } from '@/app/actions/images'
import Navbar from '@/app/components/navbar'

export default async function FeedPage() {
  const { user } = await requireAuth()

  // Fetch images
  const result = await getImages()
  const images = result.images || []

  return (
    <div className="bg-background min-h-screen">
      <Navbar username={user.email || 'user'} />
      <div className="flex justify-center align-middle text-4xl md:text-8xl text-foreground font-dark-london px-8 py-16 md:p-20 md:py-40">feed</div>
        
        {images.length === 0 ? (
          <div className="text-foreground font-stack-sans-notch text-2xl">
            no images yet. upload one now!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full p-8">
            {images.map((image) => (
              <div key={image.id} className="aspect-square overflow-hidden rounded w-full">
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
  )
}


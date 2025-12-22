import { requireAuth } from '@/app/utils/auth'
import Navbar from '@/app/components/navbar'

export default async function BruhPage() {
  const { user } = await requireAuth()

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="flex justify-center align-middle text-4xl md:text-8xl text-foreground font-dark-london px-8 py-16 md:p-20 md:py-40">booo</div>
      <div className="flex flex-col text-lg md:text-xl p-8 md:p-25 gap-8 text-foreground font-stack-sans">
        <p>screw you for uploading less than 1080p, be better 😔</p>
      </div>
    </div>
  )
}


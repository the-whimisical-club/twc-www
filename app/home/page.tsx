import { requireAuth } from '@/app/utils/auth'
import NavButtons from '@/app/components/nav-buttons'

export default async function HomePage() {
  const { user } = await requireAuth()

  return (
    <div className="bg-background min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <NavButtons username={user.email || 'user'} />
      <div className="text-6xl text-foreground font-stack-sans-notch">
        you're in
      </div>
    </div>
  )
}


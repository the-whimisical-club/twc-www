import { requireAuth } from '@/app/utils/auth'
import Navbar from '@/app/components/navbar'
import ProfileClient from './profile-client'
import { getUserProfile } from '@/app/actions/profile'
import { signOut } from '@/app/actions/auth'

export default async function ProfilePage() {
  const { user } = await requireAuth()
  
  const result = await getUserProfile()
  const profile = result.profile || null

  return (
    <div className="bg-background min-h-screen">
      <Navbar username={user.email || 'user'} />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
        <div className="max-w-2xl w-full space-y-8">
          <div className="flex items-baseline justify-between">
            <div className="text-4xl md:text-6xl text-foreground font-dark-london">
              profile
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm md:text-base font-stack-sans-notch text-foreground/70 hover:text-foreground underline hover:no-underline"
              >
                log out
              </button>
            </form>
          </div>
          
          {result.error ? (
            <div className="bg-red-500/20 text-red-500 p-4 rounded">
              {result.error}
            </div>
          ) : profile ? (
            <ProfileClient initialProfile={profile} />
          ) : (
            <div className="text-foreground font-stack-sans-notch">
              Loading profile...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


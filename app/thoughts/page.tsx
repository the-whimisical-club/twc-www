import { requireAuth } from '@/app/utils/auth'
import { getThoughts } from '@/app/actions/thoughts'
import Navbar from '@/app/components/navbar'
import ThoughtsClient from './thoughts-client'

export default async function ThoughtsPage() {
  const { user } = await requireAuth()

  // Fetch thoughts
  const result = await getThoughts()
  const rawThoughts = result.thoughts || []
  
  // Normalize thoughts - Supabase returns users as array, but we need it as object or null
  const thoughts = rawThoughts.map((thought: any) => ({
    ...thought,
    users: Array.isArray(thought.users) 
      ? thought.users[0] 
      : (thought.users as { username: string; display_name: string | null } | null)
  }))

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="flex flex-col items-center px-8 py-16 md:p-20 md:py-40">
        <div className="text-4xl md:text-8xl text-foreground font-dark-london mb-12 md:mb-20">
          thoughts
        </div>
        
        <ThoughtsClient initialThoughts={thoughts} />
      </div>
    </div>
  )
}


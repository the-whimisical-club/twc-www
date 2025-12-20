import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to signup if not authenticated
  if (!user) {
    redirect('/signup')
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="text-6xl text-foreground font-stack-sans-notch">
        you're in
      </div>
    </div>
  )
}


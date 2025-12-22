import Navbar from '@/app/components/navbar'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isUserApproved } from '@/app/utils/users'

export default async function WaitlistPage() {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // If user is logged in and approved, redirect to home
  if (user) {
    const approved = await isUserApproved(user.id)
    if (approved) {
      redirect('/home')
    }
  }

  return (
    <div className="bg-background min-h-screen flex flex-col items-center justify-center">
      <Navbar />
      <div className="flex flex-col items-center gap-8 p-8 md:p-25">
        <div className="text-4xl md:text-8xl text-foreground font-dark-london">
          ur still on a waitlist
        </div>
        <div className="text-lg md:text-xl text-foreground font-stack-sans-notch text-center max-w-2xl">
          <p>we'll let you know when you're approved!</p>
        </div>
      </div>
    </div>
  )
}


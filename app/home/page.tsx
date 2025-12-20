import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ImageUploadForm from '@/app/components/image-upload-form'

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
    <div className="bg-background min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-6xl text-foreground font-stack-sans-notch">
        you're in
      </div>
      <ImageUploadForm />
    </div>
  )
}


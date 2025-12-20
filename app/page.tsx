import IntroText from "./components/intro-text";
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <ul>
      {todos?.map((todo) => (
        <li>{todo}</li>
      ))}
    </ul>
  )
}

export default function Page() {
  return (
    <div className="bg-background">
      {/* Intro Section - Full Viewport */}
      <section className="flex justify-center items-center h-screen w-screen">
        <IntroText texts={["aloha", "welcome to", "the whimsical club"]} />
      </section>
      
      {/* Next Section - 75% Viewport Height */}
      <section id="next-section" className="flex flex-col gap-8 p-25 bg-foreground h-fit w-screen">
        <div className="text-6xl text-background font-dashing">
          wtf is this?
        </div>
        <div className="flex flex-col text-4xl text-background font-stack-sans-notch gap-8">
          <p>this is the whimsical club: a private space away from ads, algorithms, and noise. i just want to see what my friends are actually up to.</p>
          <p>if you're here, it's because you were invited. welcome. we share notes, photos, and moments from our lives.</p>
          <p>this is a place only for friends. no bullshit here.</p>
          <p>anyways, welcome :D</p>
        </div>
      </section>
    </div>
  );
}

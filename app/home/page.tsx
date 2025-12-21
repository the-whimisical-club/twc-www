import { requireAuth } from '@/app/utils/auth'
import Navbar from '@/app/components/navbar'

export default async function HomePage() {
  const { user } = await requireAuth()

  return (
    <div className="bg-background min-h-screen flex flex-col items-center justify-center">
      <Navbar username={user.email || 'user'} />
      <div className="flex justify-center align-middle text-4xl md:text-8xl text-foreground font-dark-london px-8 py-16 md:p-20 md:py-40">you're in</div>
      <div className="flex flex-col text-lg md:text-xl p-8 md:p-25 gap-8 text-foreground font-stack-sans-notch">
        <p>ok, so things are a little different here at the whimsy club.</p>
        <p>this place exists for people i think are cool. new members sign up through a form, and i decide weekly who we're letting in.</p>
        <p>you probably don't know everyone here. and that's okay. i promise they're all kind, interesting, and worth knowing. talk to them. get curious. let your guard down a little.</p>
        <p>we don't do profile pages. if you click on someone's profile picture, you'll be taken to their personal website instead. everyone tells their story differently, and we don't want to interfere with that.</p>
        <p>if you don't have a website, we'll give you a simple profile page. but c'mon, it's probably time you make one.</p>
        <p>you can share photos and thoughts here. thoughts are literally whatever's on your mind. whatever you feel like talking about.</p>
        <p>like most social platforms, you can like posts and leave comments.</p>
        <p>unlike most social platforms, you can't privately message anyone. everything here is public. every photo. every thought.</p>
        <p>every thought shared here deserves respect. everyone is entitled to their own opinions.</p>
        <p>and finally, for the sake of my bank account. there's a limit of 10 photo uploads per day. i don't own cloudflare yet, so yeah.</p>
        <p>welcome :D</p>
      </div>
    </div>
  )
}

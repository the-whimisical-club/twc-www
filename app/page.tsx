import IntroText from "./components/intro-text";
import AnimatedButton from "./components/animated-button";

export default function Page() {
  return (
    <div className="bg-background">
      {/* Introduction */}
      <section className="flex justify-center items-center h-screen w-screen">
        <IntroText texts={["aloha", "welcome to", "the whimsy club"]} />
      </section>
      
      {/* Description */}
      <section id="next-section" className="flex flex-col gap-8 p-25 bg-foreground h-fit w-screen">
        <div className="text-6xl text-background font-dashing">
          wtf is this?
        </div>
        <div className="flex flex-col text-4xl text-background font-stack-sans-notch gap-8">
          <p>this is the whimsy club: a private space away from ads, algorithms, and noise. i just want to see what my friends are actually up to.</p>
          <p>if you're here, it's because you were invited. welcome. we share notes, photos, and moments from our lives.</p>
          <p>this is a place only for friends. no bullshit here.</p>
          <p>anyways, welcome :D</p>
        </div>
      </section>

      {/* Sign Up Button */}
      <section className="flex flex-col gap-8 p-25 bg-background h-fit w-screen">
        <div className="flex flex-col text-4xl text-foreground font-stack-sans-notch gap-8">
          <p>well, you can sign up here, i can't promise you'll get in, but you can try ;{'>'}</p>
        </div>
        <div className="flex gap-4">
          <AnimatedButton text="Sign Up" href="/signup" variant="default" />
        </div>
      </section>
    </div>
  );
}

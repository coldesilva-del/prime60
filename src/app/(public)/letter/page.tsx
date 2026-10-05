import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { FOUNDING_PLACES, getFoundingPlacesLeft } from "@/lib/founding";

export const metadata: Metadata = {
  title: "A letter from Colin",
  description:
    "To the man who did well at work and paid for it everywhere else. Why I built Prime 60, what it does, and why the first 100 members never pay.",
};

function P({ children }: { children: React.ReactNode }) {
  return <p className="measure text-[17px] leading-relaxed text-ink">{children}</p>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-4 font-display text-2xl text-ink">{children}</h2>;
}

const GET = [
  "A score out of 100 every night, with every point explained, so you always know whether today counted.",
  "Three small daily promises, and a system that helps you come back after a miss without the guilt.",
  "A two-tap log for the old habits that have cost you for years, each with a better response ready.",
  "A fifteen minute rescue for the thing you keep putting off.",
  "A parking lot for new ideas and a limit of three projects, so you finish what you start.",
  "A quiet note when someone you love has gone too long without hearing from you.",
  "A Sunday review and a 90-day plan, so five years turns into quarters you can win.",
];

export default async function LetterPage() {
  const left = await getFoundingPlacesLeft();
  const placesOpen = left === null || left > 0;
  const claimLabel =
    left !== null && left > 0
      ? `Claim founding place ${FOUNDING_PLACES - left + 1} of ${FOUNDING_PLACES}`
      : "Create your account";

  return (
    <article className="space-y-5">
      <header className="space-y-3 pb-2">
        <p className="text-sm text-ink-soft">A letter from Colin de Silva</p>
        <h1 className="font-display text-[1.75rem] leading-tight text-ink sm:text-4xl">
          To the man who did well at work and paid for it everywhere else
        </h1>
      </header>

      <P>
        If you are between 50 and 65, there is a good chance the last thirty years went something like this. You
        worked hard. You provided. You built something. And the things that were supposed to wait a little while,
        your health, your marriage, your children, your friends, waited a lot longer than you meant them to.
      </P>
      <P>
        Now you look in the mirror and the man looking back is heavier, more tired and more alone than the man
        you planned to be at this age. You are not finished. But you can feel the clock.
      </P>

      <H2>You do not have a knowledge problem</H2>
      <P>
        You already know what to do. Move more. Eat better. Sleep. Ring your kids. Take your wife out. Finish the
        thing. Have the conversation. You have known for years.
      </P>
      <P>
        You have also tried. A gym membership in January. A diet. An app that counted steps. A notebook full of
        goals. Each one worked for a few weeks, then a busy month arrived and it was gone.
      </P>
      <P>
        Those things did not fail because you are weak. They failed because each one looked at a single slice of
        your life, and none of them asked the only question that matters: is the man I was today the man I
        intend to become?
      </P>

      <H2>What I built</H2>
      <P>
        I know this pattern because it is mine. I put work ahead of my health. I started more than I finished. So
        I built the tool I needed, for myself first.
      </P>
      <P>
        It is called Prime 60. You begin by describing the man you intend to be in five years: his health, his
        work, the people around him. That takes about ten minutes, once, and there are worked examples to start
        from if the page feels blank.
      </P>
      <P>
        After that it takes five minutes a day. Two in the morning to choose what matters. Three in the evening
        to tap what actually happened. Then it tells you the truth, as a score out of 100, and shows you over
        the weeks whether you are heading toward that man or away from him.
      </P>
      <P>
        It is not a diet and it is not a training plan. It will not tell you what to eat. It makes sure you do
        what you already know you should, and it keeps the evidence.
      </P>

      <H2>What you get</H2>
      <ul className="space-y-3">
        {GET.map((line) => (
          <li key={line} className="measure border-l-2 border-hairline pl-4 text-[17px] leading-relaxed text-ink">
            {line}
          </li>
        ))}
      </ul>
      <P>You get your first score tonight. You do not have to wait months to find out if it is working.</P>

      <H2>Why it is free, and why only for 100</H2>
      <P>
        I could charge for this from day one, and one day I will. But first I want {FOUNDING_PLACES} men using it
        properly and telling me straight what works and what does not. Those {FOUNDING_PLACES} are founding
        members. They get Prime 60 free for life. Not a trial. No card. No subscription later.
      </P>
      <P>
        {placesOpen
          ? left !== null
            ? `There are ${left} founding places left as I write this. When they are gone, they are gone, and the men who join after that will be asked to pay.`
            : "When the founding places are gone, they are gone, and the men who join after that will be asked to pay."
          : "The founding places have now been taken. You can still join on early access, which is free for now."}
      </P>

      <H2>What it costs you</H2>
      <P>
        Five minutes a day and some honesty. That is all. Give it fourteen days. If it is not for you, delete
        your account in a few taps and everything you entered goes with it. Nobody sees what you write but you.
      </P>
      <P>
        The real cost is on the other side. Another year of the same habits is not free. It is paid for by your
        body, and by the people who are still waiting for more of you.
      </P>

      <div className="space-y-3 pt-4">
        <ButtonLink href="/sign-up" size="full">
          {claimLabel}
        </ButtonLink>
        <p className="text-sm text-ink-soft">Free. No card. About ten minutes to set up.</p>
      </div>

      <P>
        I would be glad to have you in the first {FOUNDING_PLACES}.
      </P>
      <p className="font-display text-xl text-ink">Colin</p>

      <P>
        P.S. Think of one man you know who needs this as much as you do. A brother, a mate, a colleague. Send him
        this letter. This is easier to keep up when someone else is doing it too.
      </P>
    </article>
  );
}

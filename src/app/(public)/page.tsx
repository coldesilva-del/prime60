import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { FOUNDING_PLACES, getFoundingPlacesLeft } from "@/lib/founding";
import { getUserId } from "@/lib/supabase/server";

export const metadata: Metadata = {
  description:
    "A five-minute daily system for men 50 to 65 who want their health, their relationships and their direction back. Free for life for the first 100 members.",
};

const FAMILIAR = [
  "The career went well. Your health, your marriage and your friendships got whatever was left over.",
  "You know what to do. You start, a busy week arrives, and three months later you are back where you began.",
  "You have plenty of ideas and too few of them finished.",
  "There is a conversation you have been putting off, and a person you keep meaning to call.",
];

const STEPS = [
  {
    title: "Describe the man",
    time: "Ten minutes, once",
    body: "Say who you intend to be in five years: your health, your work, the people you love. Not sure what to write? There are ten worked examples for every question.",
  },
  {
    title: "Five minutes a day",
    time: "Two in the morning, three in the evening",
    body: "In the morning, choose what matters today. In the evening, tap what actually happened. Almost no typing.",
  },
  {
    title: "See if it is working",
    time: "From the first night",
    body: "You get a score out of 100 on day one, a direction after three days, and a proper look back every Sunday.",
  },
];

const INCLUDED = [
  {
    name: "The Prime Score",
    solves: "Know every night whether today counted. Every point is explained, so there is nothing to argue with.",
  },
  {
    name: "Three non-negotiables",
    solves: "Three small promises a day, kept small enough to do on a hard day. Miss one and the app helps you return, not feel guilty.",
  },
  {
    name: "The old pattern log",
    solves: "Catch the habits that have cost you for decades, such as putting things off or hiding, and practise a better response.",
  },
  {
    name: "I'm stuck",
    solves: "For the thing you keep avoiding. Four quick questions and a fifteen minute timer get you moving.",
  },
  {
    name: "The Idea Parking Lot",
    solves: "Park the shiny new idea and finish what you started. Three projects at a time, on purpose.",
  },
  {
    name: "People",
    solves: "A quiet note when someone who matters has gone too long without hearing from you.",
  },
  {
    name: "The Sunday review and 90-day plan",
    solves: "Fifteen minutes a week to see the truth and choose next week. Five years, broken into quarters you can win.",
  },
];

const QUESTIONS = [
  {
    q: "Is it really free?",
    a: `Yes. The first ${FOUNDING_PLACES} members are founding members and never pay a subscription. Members who join after that start free on early access, and will later be asked to pay.`,
  },
  {
    q: "Do I have to download anything?",
    a: "No. It opens in your phone's browser, and you can add it to your home screen in three taps so it works like any other app.",
  },
  {
    q: "Is this a diet or a training programme?",
    a: "No. Prime 60 does not tell you what to eat or how to train. It makes sure you do what you already know you should, and shows you the proof.",
  },
  {
    q: "Who can see what I write?",
    a: "Only you. There are no adverts and no trackers. You can export everything or delete your account whenever you like.",
  },
  {
    q: "What if I miss a few days?",
    a: "Nothing is lost and nobody tells you off. One miss is an event. Coming back is the skill the app is built to teach.",
  },
];

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl text-ink">{children}</h2>;
}

export default async function LandingPage() {
  const userId = await getUserId();
  if (userId) redirect("/today");

  const left = await getFoundingPlacesLeft();
  const open = left === null || left > 0;
  const claimLabel =
    left !== null && left > 0
      ? `Claim founding place ${FOUNDING_PLACES - left + 1} of ${FOUNDING_PLACES}`
      : "Create your account";
  const scarcity =
    left === null
      ? `The first ${FOUNDING_PLACES} members are founding members, free for life.`
      : left > 0
        ? `${left} of ${FOUNDING_PLACES} founding places left. Founding members never pay. Later members will.`
        : `All ${FOUNDING_PLACES} founding places are taken. New members join on early access.`;

  return (
    <div className="space-y-14">
      <section className="space-y-6">
        <div className="space-y-4">
          <h1 className="font-display text-[1.75rem] leading-tight text-ink sm:text-4xl">
            You built the career.
            <br />
            Now build the man.
          </h1>
          <p className="measure text-lg text-ink">
            Prime 60 is a five-minute daily system for men 50 to 65 who want their health, their relationships
            and their sense of direction back, without giving up what they have built.
          </p>
        </div>
        <div className="space-y-3">
          <ButtonLink href="/sign-up" size="full">
            {claimLabel}
          </ButtonLink>
          <ButtonLink href="/sign-in" size="full" variant="secondary">
            Sign in
          </ButtonLink>
          <p className="text-sm text-ink-soft">{scarcity}</p>
        </div>
      </section>

      <section className="space-y-4">
        <Heading>Does this sound familiar?</Heading>
        <ul className="space-y-3">
          {FAMILIAR.map((line) => (
            <li key={line} className="measure border-l-2 border-hairline pl-4 text-base text-ink">
              {line}
            </li>
          ))}
        </ul>
        <p className="measure text-base text-ink-soft">
          None of that is a lack of knowledge or willpower. It is the lack of a system that checks, every day,
          whether you are becoming the man you say you want to be.
        </p>
      </section>

      <section className="space-y-5">
        <Heading>How it works</Heading>
        <ol className="space-y-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-harbour-soft text-sm font-medium text-harbour"
              >
                {i + 1}
              </span>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                <p className="text-sm text-ink-soft">{step.time}</p>
                <p className="measure text-base text-ink">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-5">
        <Heading>What founding members get</Heading>
        <dl className="divide-y divide-hairline overflow-hidden rounded-[16px] bg-surface">
          {INCLUDED.map((item) => (
            <div key={item.name} className="space-y-1 px-4 py-4">
              <dt className="text-base font-semibold text-ink">{item.name}</dt>
              <dd className="text-base text-ink-soft">{item.solves}</dd>
            </div>
          ))}
          <div className="space-y-1 px-4 py-4">
            <dt className="text-base font-semibold text-ink">All of it, free for life</dt>
            <dd className="text-base text-ink-soft">
              Founding members keep free access to Prime 60 for life. No subscription, ever.
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4">
        <Heading>Why I built this</Heading>
        <p className="measure font-display text-lg leading-snug text-ink">
          I built Prime 60 for myself first. I wanted one place that would tell me the truth each night: did
          today move me toward the man I intend to be in five years, or away from him? The first {FOUNDING_PLACES} men
          who want the same thing join as founding members.
        </p>
        <p className="text-sm text-ink-soft">Colin de Silva</p>
        <Link href="/letter" className="inline-flex min-h-11 items-center text-base text-harbour underline-offset-4 hover:underline">
          Read my letter to you
        </Link>
      </section>

      <section className="space-y-4">
        <Heading>Nothing to lose</Heading>
        <p className="measure text-base text-ink">
          It costs nothing and takes five minutes a day. Give it fourteen days. If it is not for you, export
          your data or delete your account in a few taps. No card, no contract, no catch.
        </p>
      </section>

      <section className="space-y-5">
        <Heading>Questions</Heading>
        <dl className="space-y-5">
          {QUESTIONS.map((item) => (
            <div key={item.q} className="space-y-1">
              <dt className="text-base font-semibold text-ink">{item.q}</dt>
              <dd className="measure text-base text-ink-soft">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <Heading>{open ? "Take your place" : "Join Prime 60"}</Heading>
        <p className="measure text-base text-ink-soft">{scarcity}</p>
        <ButtonLink href="/sign-up" size="full">
          {claimLabel}
        </ButtonLink>
      </section>
    </div>
  );
}

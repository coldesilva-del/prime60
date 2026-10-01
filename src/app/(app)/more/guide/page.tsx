import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Guide" };

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-4 text-lg font-semibold text-ink">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="measure text-base text-ink">{children}</p>;
}

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Guide" backHref="/more" />

      <p className="font-display measure text-xl text-ink">
        Prime 60 is a private ledger of the man you are becoming. Two minutes in the morning, three in the
        evening, and the evidence adds up.
      </p>

      <H2>What Prime 60 is</H2>
      <P>
        You describe the man you intend to be five years from now, across four pillars: Health, Purpose,
        Relationships and Identity. Then, each day, the app asks one question in different forms: did today
        make that man more or less inevitable? Nothing here is a task list. It is a record of evidence.
      </P>

      <H2>The daily loop</H2>
      <P>
        Morning, two minutes. Confirm your three non-negotiables, name the one thing you will finish, choose a
        Courage Rep you intend to take, and pick one person to connect with. That is the whole plan.
      </P>
      <P>
        Evening, three minutes. Tap through what happened: trained, finished, connected, published, and so on.
        Rate your energy. Write one closing line if you want to. Your Prime Score settles into place and the
        day is closed.
      </P>

      <H2>The Prime Score</H2>
      <P>
        A number from 0 to 100, earned in the evening by what happened, never by what you planned. Health and
        Identity carry 30 points each; Relationships and Purpose carry 20. Every point comes from a tap you
        made, so you can always open the breakdown and see the arithmetic. A low score is information, not a
        verdict.
      </P>

      <H2>The Trajectory</H2>
      <P>
        Your 28-day rolling average, with one bar per pillar and a direction word that compares the last two
        weeks with the two before. It answers the broader question: am I behaving like that man most days?
        One day cannot move it much. A fortnight can.
      </P>

      <H2>Old patterns and replacements</H2>
      <P>
        The library holds fifteen patterns that quietly cost men the second half of their lives:
        procrastination, hiding, starting too much, letting relationships drift. You keep five in focus. Each
        has a replacement behaviour and an IF-THEN plan. When a pattern shows up, log it in two taps and note
        whether you followed it or replaced it. Appearances are counted, never judged.
      </P>

      <H2>Courage Reps</H2>
      <P>
        A Courage Rep is action despite discomfort: the conversation you were avoiding, the post you nearly
        did not publish, the ask you made anyway. Record it when it happens. Each one is a vote for your Prime
        Self and feeds the Identity pillar.
      </P>

      <H2>I&apos;m Stuck</H2>
      <P>
        When you are circling something, open I&apos;m Stuck from Today. It asks what you are avoiding and why,
        helps you find the smallest next action, and starts a fifteen minute timer. Finishing the session
        records a Courage Rep automatically.
      </P>

      <H2>The Idea Parking Lot and the project limit</H2>
      <P>
        New ideas go in the Parking Lot: one line, one tap. Nothing else is asked at that moment. When you want
        to pursue one, six filter questions stand between the idea and a new project. You can have three
        active projects by default. Starting a fourth is possible, but the app asks you to pause or finish
        something first. Change the limit under Account.
      </P>

      <H2>Finish Ratio and Return Rate</H2>
      <P>
        Finish Ratio is projects finished divided by projects started over ninety days, shown once you have
        started at least three. Return Rate is the share of missed non-negotiables you recovered the next day.
        Misses are events. Returning is the skill being measured.
      </P>

      <H2>Relationships</H2>
      <P>
        People sit in groups: Partner, Children, Family, Friends, Community. Each person has a cadence that
        suits the relationship. Drift is shown gently as a note, never as an overdue badge, and there is no
        leaderboard. Connecting with someone today is one tap.
      </P>

      <H2>The weekly review</H2>
      <P>
        Available from Sunday. It shows the week in numbers, asks a handful of questions by pillar, lets you
        rotate the patterns in focus, and ends with next week&apos;s priority and the first one thing. Fifteen
        minutes, once a week.
      </P>

      <H2>90-day cycles</H2>
      <P>
        Every ninety days you set a few objectives, one or two per pillar, each with a metric and a leading
        indicator. At the end of the cycle you decide for each: continue, adapt, stop or scale. Then you start
        the next one.
      </P>

      <H2>Vision</H2>
      <P>
        Your North Star for each pillar, your lifestyle, your identity statements, and Your Moment: the scene
        you are building toward, written in the present tense. Read it when you need to remember why. Edit it
        when you have grown.
      </P>

      <H2>Installing on a phone</H2>
      <P>
        Prime 60 works best from your home screen. On iPhone, open it in Safari, tap Share, then Add to Home
        Screen. On Android, open it in Chrome, tap the menu, then Install app. The steps with pictures are on
        the{" "}
        <Link href="/install" className="text-harbour underline-offset-4 hover:underline">
          install page
        </Link>
        . Notifications are not part of this version; habit stacks and calendar blocks do that job.
      </P>

      <H2>Privacy</H2>
      <P>
        Your entries are yours. They are stored in Sydney, encrypted at rest, and visible only to you. There
        are no advertising or analytics trackers. You can export everything as one file, or delete the account
        and every row with it, from Account. The full{" "}
        <Link href="/privacy" className="text-harbour underline-offset-4 hover:underline">
          privacy policy
        </Link>{" "}
        is short enough to read.
      </P>
    </div>
  );
}

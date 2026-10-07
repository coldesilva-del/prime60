export interface GuideSection {
  id: string;
  title: string;
  /** One or two plain sentences: what this is and why it is there. */
  intro: string;
  steps: string[];
  /** A short "good to know" line shown after the steps. */
  tip?: string;
}

export interface GuidePart {
  title: string;
  sections: GuideSection[];
}

/**
 * The step-by-step help guide. Written in short, plain sentences so that
 * anyone can follow it. Button names match the app exactly.
 */
export const GUIDE: GuidePart[] = [
  {
    title: "Getting started",
    sections: [
      {
        id: "what-it-is",
        title: "What Prime 60 is",
        intro:
          "Prime 60 is like a diary that helps you become the man you want to be in five years. You tell it who that man is. Then, every day, you tell it what you did. It adds things up and shows you if you are getting closer.",
        steps: [
          "In the morning you spend two minutes choosing what matters today.",
          "During the day you tap things as you do them.",
          "In the evening you spend three minutes saying what happened, and you get a score out of 100.",
          "Once a week, on Sunday, you look back at the whole week.",
        ],
        tip: "You cannot break anything. Almost everything can be changed later.",
      },
      {
        id: "sign-up",
        title: "Make your account",
        intro: "You need an account so the app can remember your answers. You only do this once.",
        steps: [
          "Open prime60.colindesilva.com.",
          "Tap Create your account.",
          "Type your first name, your email and a password. The password needs at least 10 letters or numbers.",
          "Tick the box to agree to the terms. The second box, for emails from Colin, is your choice.",
          "Tap Create account. The app will say Check your email.",
          "Open your email. Find the one called Confirm your email for Prime 60 and tap Confirm and begin.",
        ],
        tip: "No email after two minutes? Look in your spam folder. Still nothing? Tap Send the link again.",
      },
      {
        id: "install",
        title: "Put it on your phone",
        intro: "This gives Prime 60 its own picture on your phone, like any other app. There is nothing to download from a store.",
        steps: [
          "On iPhone, open prime60.colindesilva.com in Safari. It must be Safari.",
          "Tap Share. It is the square with an arrow pointing up.",
          "Scroll down and tap Add to Home Screen.",
          "Tap Add. Prime 60 is now on your home screen.",
          "On Android, open it in Chrome, tap the three dots, then tap Install app.",
        ],
        tip: "Always open Prime 60 from its picture on your home screen. That way you stay signed in.",
      },
      {
        id: "setup",
        title: "Set it up the first time",
        intro:
          "The first time you sign in, the app asks you some questions. This takes about ten minutes. If you stop halfway, it remembers where you were.",
        steps: [
          "Welcome. Check your first name. Pick your target year, which is the year you are aiming for. Five years from now is already filled in.",
          "Health North Star. Write what your health looks like in that year. Your North Star is your big goal, the place you are heading.",
          "Purpose North Star. Write what your work and money look like in that year.",
          "Relationships North Star. Write what life with the people you love looks like in that year.",
          "Lifestyle and Your Moment. Write how you live. Then describe one perfect moment from that future, as if you are there right now.",
          "Old patterns. These are old habits that hold you back, like putting things off. Pick up to five to watch for.",
          "People. Add the names of the people who matter most to you.",
          "Non-negotiables. Pick three small promises you will keep every single day, like a walk or going to bed on time.",
          "Who are you becoming? Write one sentence that starts with I am a man who. Then choose how you want to track health.",
          "Tap Finish and open Today. You are in.",
        ],
        tip: "Stuck on what to write? Tap See a worked example. There are ten for each question. Tap See another example until you find one you like, tap Use this as a starting point, then change the words to fit you.",
      },
    ],
  },
  {
    title: "Every day",
    sections: [
      {
        id: "today",
        title: "The Today screen",
        intro: "Today is your home screen. It shows what matters today and nothing else.",
        steps: [
          "At the top is a message telling you what to do next, such as Start the morning or Close the day. Tap it.",
          "Under that is your Trajectory. It shows if you are heading the right way. It says Building until you have used the app for three days.",
          "Next are your three non-negotiables. Tap one when you have done it and the circle fills in.",
          "Then comes the one thing to finish today. Tap Finished when it is done.",
          "Below that are your Courage Rep and the person you chose to connect with. Tap each one when it is done.",
          "The round plus button in the bottom right opens quick actions.",
          "The I'm stuck button in the bottom left is for when you cannot get going.",
        ],
        tip: "The five words along the bottom are the five parts of the app: Today, Progress, Plan, Vision and More.",
      },
      {
        id: "morning",
        title: "The morning check-in",
        intro: "Two minutes to decide what a good day looks like. Do it before your day gets busy.",
        steps: [
          "On Today, tap Start the morning.",
          "Read the sentence about who you are becoming. Tap Continue.",
          "Look at your three non-negotiables. Tap Same as yesterday, or change them for today only.",
          "Type the one thing that must be finished today. You can also pick the next step from one of your projects.",
          "Pick a Courage Rep you might need today. A Courage Rep is one brave thing, like a hard phone call. You can skip this.",
          "Pick one person to give your time to today.",
          "Tap Start the day. You are back on Today with your plan showing.",
        ],
      },
      {
        id: "during-the-day",
        title: "During the day",
        intro: "As things happen, tell the app. Each one takes a few seconds.",
        steps: [
          "Did a non-negotiable? Open Today and tap it.",
          "Finished your one thing? Tap Finished.",
          "Something else happened? Tap the round plus button in the bottom right.",
          "Choose from Log a pattern, Courage Rep, Park an idea, Connected with someone or Health note.",
          "Answer the short question and close it. That is all.",
        ],
      },
      {
        id: "evening",
        title: "The evening check-in and your score",
        intro:
          "Three minutes to say what really happened today. At the end you get your Prime Score. From 6 pm, Today shows this for you.",
        steps: [
          "On Today, tap Close the day.",
          "Health. Answer Trained today? and Moved today? Then tap a number for Energy, from 1 to 10.",
          "Identity. Answer Finished the one thing? and Courage Rep today?",
          "Old patterns. If an old habit showed up, tap Log one.",
          "Relationships. Answer whether you connected with your person, and whether you had quality time with no phones.",
          "Purpose. Answer Published something? Served someone? and whether you moved your project forward.",
          "Tap Reveal today's score. It is a number from 0 to 100.",
          "Tap Why this score to see where every point came from.",
          "If you like, finish the sentence Today I became my Prime Self by. Then tap Done.",
        ],
        tip: "A low score is not a bad mark. It just tells you what happened. Tomorrow you start again from zero.",
      },
    ],
  },
  {
    title: "Tools for hard moments",
    sections: [
      {
        id: "patterns",
        title: "When an old habit shows up",
        intro:
          "An old pattern is a habit that pulls you backwards, like putting things off or hiding. Logging it helps you notice it sooner next time. It is counted, never judged.",
        steps: [
          "Tap the round plus button, then Log a pattern.",
          "Tap the pattern that showed up.",
          "Tap Followed it if the old habit won. Tap Did the replacement if you did the better thing.",
          "That is enough. If you want to say more, tap Add detail. Every box there is optional.",
          "To choose which patterns to watch, go to More, then Patterns. Pick up to five.",
          "Tap a pattern there to write your own replacement and your own IF-THEN plan. An IF-THEN plan is a rule you make ahead of time, like IF I want to put it off, THEN I start for two minutes.",
        ],
      },
      {
        id: "courage",
        title: "Courage Reps",
        intro:
          "A Courage Rep is doing something even though it feels uncomfortable. Each one is proof you are changing. Think of it like one lift at the gym, but for bravery.",
        steps: [
          "Tap the round plus button, then Courage Rep.",
          "Tap what you did. If it is not on the list, tap Something else and give it a short name.",
          "Add a note if you want to. Then close it.",
        ],
      },
      {
        id: "stuck",
        title: "I'm stuck",
        intro: "Use this when you know what to do but cannot make yourself start.",
        steps: [
          "On Today, tap I'm stuck in the bottom left.",
          "Answer What are you avoiding?",
          "Tap why. For example, fear, or not knowing where to begin.",
          "Type the smallest step you could take.",
          "Tap Do it for 15 minutes. A timer starts. Work on only that step until it ends.",
          "When the time is up, the app asks Did you move forward? Tap Yes, Partly or No.",
          "Yes gives you a Courage Rep. Partly asks for your next step. No helps you pick an even smaller step, then you can tap Start for 2 minutes.",
        ],
      },
      {
        id: "ideas",
        title: "The Idea Parking Lot",
        intro:
          "New ideas are exciting, but chasing every one stops you finishing anything. Park the idea here so it is safe, then get back to what you were doing.",
        steps: [
          "Tap the round plus button, then Park an idea.",
          "Type the idea in one line. Close it. Done.",
          "Later, go to Plan, then Ideas to see everything you parked.",
          "Tap an idea, then Consider pursuing. The app asks six short questions to test if it is worth your time.",
          "Then choose: Pursue, Review in 30 days, Park or Kill.",
        ],
        tip: "Kill does not delete the idea. It moves to a Killed list in case you change your mind.",
      },
    ],
  },
  {
    title: "Plan",
    sections: [
      {
        id: "projects",
        title: "Projects and finishing",
        intro:
          "A project is something bigger that takes more than a day. The app lets you have three going at once, so you finish things before starting new ones.",
        steps: [
          "Go to Plan, then Projects. Tap New project.",
          "Give it a name. Choose its pillar. A pillar is one of the four parts of your life: Health, Purpose, Relationships or Identity.",
          "Fill in Definition of done. This means: how will you know it is finished?",
          "Fill in Next action. This is the very next small step.",
          "Tap Start active to begin now, or Save as idea to keep it for later.",
          "When it is done, open the project and tap Finished. You can also tap Pause, Blocked or Kill.",
          "If you try to start a fourth project, the app asks you to choose: Finish one first, Pause one, Kill one, or Override and add anyway.",
        ],
        tip: "Finish Ratio compares how many projects you finished with how many you started. It appears once you have started three.",
      },
      {
        id: "cycle",
        title: "Your 90-day plan",
        intro: "Five years is a long way off. A 90-day cycle breaks it into a goal you can reach in about three months.",
        steps: [
          "Go to Plan, then 90 days. Tap Start a cycle and pick the start date.",
          "Tap Add objective. An objective is one goal for these 90 days.",
          "Choose its pillar. Write the Outcome, which is what will be true in 90 days.",
          "Fill in the rest if it helps: Why, Starting point, Metric, Target, Leading indicator and Next action. A leading indicator is the thing you do each week that gets you there.",
          "You can have up to six objectives.",
          "After 90 days, tap Close cycle. For each objective choose Continue, Adapt, Stop or Scale.",
        ],
      },
      {
        id: "roadmap",
        title: "The Roadmap",
        intro: "The Roadmap shows the whole path on one page, from today to your target year.",
        steps: [
          "Go to Plan, then Roadmap.",
          "Read from Today at the top down to your Prime Self at the bottom.",
          "To add something to a stage, type in Add a line and tap Add.",
          "Use the arrows to move a line up or down.",
        ],
      },
    ],
  },
  {
    title: "Health, people and progress",
    sections: [
      {
        id: "health",
        title: "Health",
        intro:
          "Track as much or as little as you like. If you already have a coach, choose the light version and only log a weekly weigh-in.",
        steps: [
          "To log, tap the round plus button, then Health note. Every box is optional.",
          "On your weigh-in day, Today shows Weigh in. Tap it and enter your weight.",
          "To see your charts, go to Progress, then Health.",
          "To change what you track, go to More, then Health.",
          "There you can switch between Track here and Coached elsewhere, hide boxes you do not use, set your target weight, and choose your weigh-in day.",
        ],
      },
      {
        id: "people",
        title: "People",
        intro: "This is for the people you love. It helps you notice when you have not been in touch for a while. It is not a contact list.",
        steps: [
          "Go to More, then People.",
          "The first time, tap Set up groups. You get Partner, Children, Family, Friends and Community. You can rename them.",
          "Type a name under a group and tap Add.",
          "Tap a person to choose their Cadence. Cadence means how often you want to connect, such as every week.",
          "When you connect with someone, tap the round plus button, then Connected with someone.",
          "If someone has gone quiet for too long, the app gives you a gentle note. It never nags.",
        ],
      },
      {
        id: "progress",
        title: "Progress",
        intro: "Progress answers one question: where am I? It turns your daily taps into simple charts.",
        steps: [
          "Tap Progress at the bottom of the screen.",
          "Overview shows your Prime Score over time and your Trajectory.",
          "Tap Health, Identity or Relationships at the top for more detail on each one.",
          "Use Period to look at a shorter or longer stretch of time.",
          "Tap any number to see exactly how it was worked out.",
        ],
        tip: "Trajectory is your average over the last 28 days you logged. One bad day barely moves it. Two good weeks do.",
      },
      {
        id: "review",
        title: "The Sunday review",
        intro: "Once a week you spend about 15 minutes looking back and choosing what matters next week.",
        steps: [
          "On Sunday, Today shows Weekly review. Tap it.",
          "Go through the six parts in order: Health, Purpose, Relationships, Identity, Atomic habits and Next week.",
          "Each part shows your numbers for the week and asks a few short questions. One line each is plenty.",
          "At the end you set next week's main priority and check your three non-negotiables.",
          "Tap Go to Today when you see Review complete.",
        ],
      },
    ],
  },
  {
    title: "Vision and settings",
    sections: [
      {
        id: "vision",
        title: "Vision",
        intro: "Vision is where your big goal lives. Read it when you need reminding why you are doing this.",
        steps: [
          "Tap Vision at the bottom of the screen.",
          "Read your North Star for each pillar, your lifestyle and Your Moment.",
          "To change the words, tap Edit.",
          "You can add a photo to sit behind the words. It must be a JPEG, PNG or WebP under 5 MB.",
        ],
      },
      {
        id: "daily-settings",
        title: "Change your daily setup",
        intro: "As you grow, your promises and words will change. All of these are under More.",
        steps: [
          "Non-negotiables. Tap Change next to one to swap it. The new one starts tomorrow.",
          "Identity statements. Add more sentences about who you are becoming. Tap Make primary on the one you want to see on Today.",
          "Habit stacks. A habit stack ties a new habit to something you already do. Fill in After and I will, like After I pour my coffee, I will write my one thing. You can have up to eight.",
          "Patterns. Choose the five old patterns you want to watch.",
        ],
      },
      {
        id: "account",
        title: "Your account",
        intro: "Go to More, then Account, to change things about you and the app.",
        steps: [
          "Profile. Change your first name, timezone and target year.",
          "Appearance. Choose a light or dark look.",
          "Rhythm. Choose the hour the evening check-in starts, your weigh-in day and how many projects you can have going at once.",
          "Email. Turn emails from Colin on or off.",
          "Your data. Tap Export my data to save a copy of everything you have entered.",
          "Delete account. This removes everything for good. You have to type DELETE to confirm.",
          "To sign out, go back to More and tap Sign out at the bottom.",
          "Know a man who would want this? Go to More, then Invite a friend, and tap Send the invitation.",
        ],
      },
    ],
  },
  {
    title: "If something goes wrong",
    sections: [
      {
        id: "trouble",
        title: "Quick fixes",
        intro: "Most problems have a simple fix. Try these first.",
        steps: [
          "Forgot your password? On the sign-in screen tap Forgot your password? and follow the email.",
          "Do not want to type a password? Tap Email me a sign-in link instead.",
          "The app says a link has expired or was already used? Each link works only once and lasts one hour. Ask for a new one.",
          "No email? Check spam. Check you typed your address correctly. Then tap Send the link again.",
          "The screen says That page is not here? The address is wrong. Tap Go to Today.",
          "The screen says You are offline? You have no internet right now. Anything you tapped is saved when you are back online.",
          "Missed a day? Nothing is lost. Open Today and carry on. Coming back is the skill.",
        ],
      },
    ],
  },
];
